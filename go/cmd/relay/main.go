package main

import (
	"flag"
	"fmt"
	"log"
	"net"
	"sync"
	"time"

	"github.com/GFPC/Enywheria/pkg/protocol"
)

type NodeInfo struct {
	Addr     *net.UDPAddr
	LastSeen time.Time
}

type RelayServer struct {
	conn       *net.UDPConn
	token      string
	nodes      map[string]*NodeInfo
	nodesMutex sync.RWMutex
}

func NewRelayServer(token string) *RelayServer {
	return &RelayServer{
		token: token,
		nodes: make(map[string]*NodeInfo),
	}
}

func (s *RelayServer) ListenAndServe(host string, port int) error {
	addr, err := net.ResolveUDPAddr("udp", fmt.Sprintf("%s:%d", host, port))
	if err != nil {
		return err
	}

	conn, err := net.ListenUDP("udp", addr)
	if err != nil {
		return err
	}
	s.conn = conn
	defer conn.Close()

	log.Printf("[Go STUN/Relay] Server running on %s:%d (token: %s)\n", host, port, s.token)

	buf := make([]byte, 65535)
	for {
		n, raddr, err := conn.ReadFromUDP(buf)
		if err != nil {
			log.Printf("Read error: %v\n", err)
			continue
		}

		pktData := make([]byte, n)
		copy(pktData, buf[:n])

		go s.handlePacket(pktData, raddr)
	}
}

func (s *RelayServer) handlePacket(data []byte, addr *net.UDPAddr) {
	pkt, err := protocol.ParsePacket(data)
	if err != nil || pkt == nil {
		return
	}

	if pkt.Token != s.token {
		log.Printf("Unauthorized packet from %s (invalid token)\n", addr)
		return
	}

	sender := pkt.Sender
	if sender == "" {
		return
	}

	s.nodesMutex.Lock()
	s.nodes[sender] = &NodeInfo{
		Addr:     addr,
		LastSeen: time.Now(),
	}
	s.nodesMutex.Unlock()

	switch pkt.Type {
	case "REGISTER":
		log.Printf("Registered node '%s' at %s\n", sender, addr)
		ack, _ := protocol.CreatePacket("REGISTER_ACK", "SERVER", sender, s.token, map[string]interface{}{
			"public_ip":   addr.IP.String(),
			"public_port": addr.Port,
		})
		s.conn.WriteToUDP(ack, addr)

	case "LOOKUP":
		target := pkt.Target
		log.Printf("Node '%s' requested lookup for '%s'\n", sender, target)
		s.nodesMutex.RLock()
		targetNode, exists := s.nodes[target]
		s.nodesMutex.RUnlock()

		if exists {
			// Notify sender about target's endpoint
			infoReq, _ := protocol.CreatePacket("PEER_INFO", "SERVER", sender, s.token, map[string]interface{}{
				"target_id": target,
				"ip":        targetNode.Addr.IP.String(),
				"port":      targetNode.Addr.Port,
			})
			s.conn.WriteToUDP(infoReq, addr)

			// Notify target about sender's endpoint
			infoTarget, _ := protocol.CreatePacket("PEER_INFO", "SERVER", target, s.token, map[string]interface{}{
				"target_id": sender,
				"ip":        addr.IP.String(),
				"port":      addr.Port,
			})
			s.conn.WriteToUDP(infoTarget, targetNode.Addr)
		} else {
			log.Printf("Lookup failed: target '%s' not registered\n", target)
		}

	case "RELAY_DATA":
		target := pkt.Target
		s.nodesMutex.RLock()
		targetNode, exists := s.nodes[target]
		s.nodesMutex.RUnlock()

		if exists {
			s.conn.WriteToUDP(data, targetNode.Addr)
		}

	case "PING":
		pong, _ := protocol.CreatePacket("PONG", "SERVER", sender, s.token, nil)
		s.conn.WriteToUDP(pong, addr)
	}
}

func main() {
	host := flag.String("host", "0.0.0.0", "Host IP to bind")
	port := flag.Int("port", 9000, "UDP Port to listen")
	token := flag.String("token", "default_p2p_token", "Secret authentication token")
	flag.Parse()

	server := NewRelayServer(*token)
	if err := server.ListenAndServe(*host, *port); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
