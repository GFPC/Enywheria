package main

import (
	"bufio"
	"fmt"
	"log"
	"net"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/GFPC/Enywheria/pkg/crypto"
	"github.com/GFPC/Enywheria/pkg/protocol"
)

type P2PNode struct {
	nodeID         string
	targetID       string
	relayAddr      *net.UDPAddr
	token          string
	conn           *net.UDPConn
	peerAddr       *net.UDPAddr
	isDirect       bool
	peerAddrMutex  sync.RWMutex
	registeredChan chan bool
	peerDiscovChan chan bool
	punchAckChan   chan bool
}

func NewP2PNode(nodeID, targetID, relayStr, token string, localPort int) (*P2PNode, error) {
	raddr, err := net.ResolveUDPAddr("udp", relayStr)
	if err != nil {
		return nil, fmt.Errorf("invalid relay address: %w", err)
	}

	laddr, err := net.ResolveUDPAddr("udp", fmt.Sprintf("0.0.0.0:%d", localPort))
	if err != nil {
		return nil, err
	}

	conn, err := net.ListenUDP("udp", laddr)
	if err != nil {
		return nil, err
	}

	return &P2PNode{
		nodeID:         nodeID,
		targetID:       targetID,
		relayAddr:      raddr,
		token:          token,
		conn:           conn,
		registeredChan: make(chan bool, 1),
		peerDiscovChan: make(chan bool, 1),
		punchAckChan:   make(chan bool, 1),
	}, nil
}

func (n *P2PNode) Start() {
	go n.readLoop()
	go n.keepaliveLoop()

	// Register with relay server
	n.register()

	select {
	case <-n.registeredChan:
		log.Println("[Go P2P] Registered with relay server.")
	case <-time.After(5 * time.Second):
		log.Println("[Go P2P] Warning: STUN registration timeout.")
	}
}

func (n *P2PNode) register() {
	pkt, _ := protocol.CreatePacket("REGISTER", n.nodeID, "", n.token, nil)
	n.conn.WriteToUDP(pkt, n.relayAddr)
}

func (n *P2PNode) keepaliveLoop() {
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()
	for range ticker.C {
		n.register()
	}
}

func (n *P2PNode) ConnectPeer() bool {
	log.Printf("[Go P2P] Looking up target peer '%s'...\n", n.targetID)
	pkt, _ := protocol.CreatePacket("LOOKUP", n.nodeID, n.targetID, n.token, nil)
	n.conn.WriteToUDP(pkt, n.relayAddr)

	select {
	case <-n.peerDiscovChan:
	case <-time.After(5 * time.Second):
		log.Printf("[Go P2P] Error: Peer discovery timeout for '%s'\n", n.targetID)
		return false
	}

	n.peerAddrMutex.RLock()
	targetAddr := n.peerAddr
	n.peerAddrMutex.RUnlock()

	if targetAddr == nil {
		return false
	}

	log.Printf("[Go P2P] Punching UDP hole to %s at %s...\n", n.targetID, targetAddr)
	punchPkt, _ := protocol.CreatePacket("PUNCH", n.nodeID, n.targetID, n.token, nil)

	for i := 0; i < 5; i++ {
		n.conn.WriteToUDP(punchPkt, targetAddr)
		time.Sleep(200 * time.Millisecond)
	}

	select {
	case <-n.punchAckChan:
		n.isDirect = true
		log.Printf("[Go P2P] Direct UDP P2P Link Established with '%s'! Mode: DIRECT_P2P\n", n.targetID)
		return true
	case <-time.After(3 * time.Second):
		n.isDirect = false
		log.Printf("[Go P2P] Direct UDP hole punch timed out (CGNAT). Falling back to RELAY mode via %s\n", n.relayAddr)
		return true
	}
}

func (n *P2PNode) SendMessage(payload map[string]interface{}) {
	n.peerAddrMutex.RLock()
	targetAddr := n.peerAddr
	isDirect := n.isDirect
	n.peerAddrMutex.RUnlock()

	var dest *net.UDPAddr
	if isDirect && targetAddr != nil {
		dest = targetAddr
	} else {
		dest = n.relayAddr
	}

	pkt, err := crypto.PackEncryptedPayload(n.nodeID, n.targetID, payload, n.token, !isDirect)
	if err != nil {
		log.Printf("Encryption error: %v\n", err)
		return
	}

	n.conn.WriteToUDP(pkt, dest)
}

func (n *P2PNode) readLoop() {
	buf := make([]byte, 65535)
	for {
		lenN, raddr, err := n.conn.ReadFromUDP(buf)
		if err != nil {
			return
		}

		pkt, err := protocol.ParsePacket(buf[:lenN])
		if err != nil || pkt == nil {
			continue
		}

		switch pkt.Type {
		case "REGISTER_ACK":
			select {
			case n.registeredChan <- true:
			default:
			}

		case "PEER_INFO":
			ipStr, _ := pkt.Payload["ip"].(string)
			portNum, _ := pkt.Payload["port"].(float64)
			targetID, _ := pkt.Payload["target_id"].(string)

			if targetID == n.targetID && ipStr != "" {
				addr, err := net.ResolveUDPAddr("udp", fmt.Sprintf("%s:%d", ipStr, int(portNum)))
				if err == nil {
					n.peerAddrMutex.Lock()
					n.peerAddr = addr
					n.peerAddrMutex.Unlock()
					select {
					case n.peerDiscovChan <- true:
					default:
					}
				}
			}

		case "PUNCH":
			ack, _ := protocol.CreatePacket("PUNCH_ACK", n.nodeID, pkt.Sender, n.token, nil)
			n.conn.WriteToUDP(ack, raddr)
			n.peerAddrMutex.Lock()
			n.peerAddr = raddr
			n.isDirect = true
			n.peerAddrMutex.Unlock()

		case "PUNCH_ACK":
			n.peerAddrMutex.Lock()
			n.peerAddr = raddr
			n.isDirect = true
			n.peerAddrMutex.Unlock()
			select {
			case n.punchAckChan <- true:
			default:
			}

		case "DATA", "RELAY_DATA":
			isRelay := pkt.Type == "RELAY_DATA"
			modeStr := "DIRECT_P2P"
			if isRelay {
				modeStr = "RELAY"
			}

			decPayload, err := crypto.UnpackEncryptedPayload(pkt.Payload, n.token)
			if err == nil && decPayload != nil {
				cmd, _ := decPayload["cmd"].(string)
				resp, _ := decPayload["resp"].(string)

				if resp == "ping" {
					sentTime, _ := decPayload["time"].(float64)
					latency := float64(time.Now().UnixNano())/1e6 - (sentTime * 1000)
					fmt.Printf("\n🏓 [%s] Pong from %s! Latency: %.2f ms\n%s> ", modeStr, pkt.Sender, latency, n.nodeID)
				} else if cmd == "ping" {
					n.SendMessage(map[string]interface{}{"resp": "ping", "time": decPayload["time"]})
				} else {
					msgStr, _ := decPayload["msg"].(string)
					if msgStr == "" {
						msgStr = fmt.Sprintf("%v", decPayload)
					}
					fmt.Printf("\n📩 [%s] From %s: %s\n%s> ", modeStr, pkt.Sender, msgStr, n.nodeID)
				}
			}
		}
	}
}

func parseCLIArgs(args []string) (relay, nodeID, targetID, token string, localPort int) {
	token = "default_p2p_token"
	var positional []string
	execName := os.Args[0]

	for i := 0; i < len(args); i++ {
		arg := args[i]
		if arg == execName || strings.Contains(arg, "enywheria-p2p") {
			continue
		}

		if strings.HasPrefix(arg, "-") {
			cleanKey := strings.TrimLeft(arg, "-")
			var val string
			if idx := strings.Index(cleanKey, "="); idx != -1 {
				val = cleanKey[idx+1:]
				cleanKey = cleanKey[:idx]
			} else if i+1 < len(args) && !strings.HasPrefix(args[i+1], "-") {
				val = args[i+1]
				i++
			}

			switch strings.ToLower(cleanKey) {
			case "relay", "r":
				relay = val
			case "node-id", "node_id", "nodeid", "node", "n":
				nodeID = val
			case "target-id", "target_id", "targetid", "target", "t":
				targetID = val
			case "token", "k":
				token = val
			case "local-port", "port", "p":
				fmt.Sscanf(val, "%d", &localPort)
			}
		} else {
			positional = append(positional, arg)
		}
	}

	// Smart positional assignment
	for _, p := range positional {
		if relay == "" && strings.Contains(p, ":") {
			relay = p
		} else if nodeID == "" {
			nodeID = p
		} else if targetID == "" {
			targetID = p
		} else if token == "" || token == "default_p2p_token" {
			token = p
		}
	}

	return
}

func main() {
	relayVal, nodeVal, targetVal, tokenVal, portVal := parseCLIArgs(os.Args[1:])

	if relayVal == "" || nodeVal == "" || targetVal == "" {
		fmt.Println("[P2P Node] Usage:")
		fmt.Println("  Flags:      enywheria-p2p -relay 89.125.140.47:9000 -node phone -target pc [-token secret]")
		fmt.Println("  Positional: enywheria-p2p 89.125.140.47:9000 phone pc [secret]")
		log.Fatalf("Error: Missing required arguments (relay address, node-id, or target-id).")
	}

	node, err := NewP2PNode(nodeVal, targetVal, relayVal, tokenVal, portVal)
	if err != nil {
		log.Fatalf("Initialization failed: %v", err)
	}

	node.Start()
	node.ConnectPeer()

	fmt.Printf("\n=======================================================\n")
	fmt.Printf("🚀 Go P2P Interactive Terminal Ready! Linked with '%s'\n", targetVal)
	fmt.Printf("Commands: /ping, /help, exit\n")
	fmt.Printf("Or type text to send encrypted message.\n")
	fmt.Printf("=======================================================\n\n")

	scanner := bufio.NewScanner(os.Stdin)
	fmt.Printf("%s> ", nodeVal)
	for scanner.Scan() {
		text := strings.TrimSpace(scanner.Text())
		if text == "" {
			fmt.Printf("%s> ", nodeVal)
			continue
		}
		if strings.ToLower(text) == "exit" {
			break
		}

		if text == "/ping" {
			node.SendMessage(map[string]interface{}{
				"cmd":  "ping",
				"time": float64(time.Now().UnixNano()) / 1e9,
			})
		} else if text == "/help" {
			fmt.Println("\nAvailable commands: /ping, /help, exit")
		} else {
			node.SendMessage(map[string]interface{}{
				"msg":  text,
				"time": float64(time.Now().UnixNano()) / 1e9,
			})
		}

		fmt.Printf("%s> ", nodeVal)
	}
}
