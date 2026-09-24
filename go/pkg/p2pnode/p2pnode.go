package p2pnode

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"log"
	"net"
	"sync"
	"time"

	"github.com/GFPC/Enywheria/pkg/crypto"
	"github.com/GFPC/Enywheria/pkg/fileservice"
	"github.com/GFPC/Enywheria/pkg/models"
	"github.com/GFPC/Enywheria/pkg/protocol"
	"github.com/GFPC/Enywheria/pkg/repository"
)

type P2PNode struct {
	nodeID         string
	targetID       string
	relayAddr      *net.UDPAddr
	token          string
	conn           *net.UDPConn
	peerAddr       *net.UDPAddr
	localPeerAddr  *net.UDPAddr
	isDirect       bool
	peerAddrMutex  sync.RWMutex
	registeredChan chan bool
	peerDiscovChan chan bool
	punchAckChan   chan bool

	fileService *fileservice.FileService
	repo        *repository.Repository
}

func getLocalIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return ""
	}
	for _, address := range addrs {
		if ipnet, ok := address.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String()
			}
		}
	}
	return ""
}

func getBroadcastAddresses(port int) []*net.UDPAddr {
	var addrs []*net.UDPAddr
	if gaddr, err := net.ResolveUDPAddr("udp", fmt.Sprintf("255.255.255.255:%d", port)); err == nil {
		addrs = append(addrs, gaddr)
	}

	ifaces, err := net.Interfaces()
	if err != nil {
		return addrs
	}

	for _, iface := range ifaces {
		if iface.Flags&net.FlagLoopback != 0 {
			continue
		}
		addrsList, err := iface.Addrs()
		if err != nil {
			continue
		}
		for _, addr := range addrsList {
			ipnet, ok := addr.(*net.IPNet)
			if !ok || ipnet.IP.IsLoopback() || ipnet.IP.To4() == nil {
				continue
			}
			ip := ipnet.IP.To4()
			mask := ipnet.Mask
			if len(mask) == 4 {
				bcast := make(net.IP, 4)
				for i := 0; i < 4; i++ {
					bcast[i] = ip[i] | ^mask[i]
				}
				if uaddr, err := net.ResolveUDPAddr("udp", fmt.Sprintf("%s:%d", bcast.String(), port)); err == nil {
					addrs = append(addrs, uaddr)
				}
			}
		}
	}
	return addrs
}

func NewP2PNode(nodeID, targetID, relayStr, token string, localPort int, fs *fileservice.FileService, repo *repository.Repository) (*P2PNode, error) {
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
		fileService:    fs,
		repo:           repo,
	}, nil
}

func (n *P2PNode) GetNodeID() string { return n.nodeID }

func (n *P2PNode) Start() {
	go n.readLoop()
	go n.keepaliveLoop()
	go n.startLANDiscovery()

	n.register()

	select {
	case <-n.registeredChan:
		log.Println("[Go P2P] Registered with relay server.")
	case <-time.After(5 * time.Second):
		log.Println("[Go P2P] Warning: STUN registration timeout.")
	}
}

const lanBroadcastPort = 9999

func (n *P2PNode) startLANDiscovery() {
	go n.lanListenLoop()
	go n.lanBroadcastLoop()
}

func (n *P2PNode) lanBroadcastLoop() {
	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	boundPort := n.conn.LocalAddr().(*net.UDPAddr).Port

	for range ticker.C {
		announce, _ := protocol.CreatePacket("LAN_ANNOUNCE", n.nodeID, n.targetID, n.token, map[string]interface{}{
			"port": float64(boundPort),
		})
		bcastAddrs := getBroadcastAddresses(lanBroadcastPort)
		for _, baddr := range bcastAddrs {
			n.conn.WriteToUDP(announce, baddr)
		}
	}
}

func (n *P2PNode) lanListenLoop() {
	addr, err := net.ResolveUDPAddr("udp", fmt.Sprintf("0.0.0.0:%d", lanBroadcastPort))
	if err != nil {
		return
	}

	bconn, err := net.ListenUDP("udp", addr)
	if err != nil {
		return
	}
	defer bconn.Close()

	buf := make([]byte, 65535)
	for {
		lenN, raddr, err := bconn.ReadFromUDP(buf)
		if err != nil {
			return
		}

		pkt, err := protocol.ParsePacket(buf[:lenN])
		if err != nil || pkt == nil {
			continue
		}

		if pkt.Type == "LAN_ANNOUNCE" && pkt.Token == n.token && pkt.Sender == n.targetID {
			portNum, _ := pkt.Payload["port"].(float64)
			localPeerAddr, err := net.ResolveUDPAddr("udp", fmt.Sprintf("%s:%d", raddr.IP.String(), int(portNum)))
			if err == nil {
				n.peerAddrMutex.Lock()
				alreadyDirect := n.isDirect && n.peerAddr != nil && n.peerAddr.String() == localPeerAddr.String()
				n.peerAddr = localPeerAddr
				n.isDirect = true
				n.peerAddrMutex.Unlock()

				if !alreadyDirect {
					log.Printf("[Go P2P] Discovered local LAN peer '%s' at %s! Mode: DIRECT_LAN (1-5ms)\n", pkt.Sender, localPeerAddr)
				}

				select {
				case n.punchAckChan <- true:
				default:
				}
			}
		}
	}
}

func (n *P2PNode) register() {
	localIP := getLocalIP()
	boundPort := n.conn.LocalAddr().(*net.UDPAddr).Port
	pkt, _ := protocol.CreatePacket("REGISTER", n.nodeID, "", n.token, map[string]interface{}{
		"local_ip":   localIP,
		"local_port": float64(boundPort),
	})
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
	localTargetAddr := n.localPeerAddr
	n.peerAddrMutex.RUnlock()

	if targetAddr == nil && localTargetAddr == nil {
		return false
	}

	if localTargetAddr != nil {
		log.Printf("[Go P2P] Punching local LAN UDP hole to %s at %s...\n", n.targetID, localTargetAddr)
	}
	if targetAddr != nil {
		log.Printf("[Go P2P] Punching WAN UDP hole to %s at %s...\n", n.targetID, targetAddr)
	}

	punchPkt, _ := protocol.CreatePacket("PUNCH", n.nodeID, n.targetID, n.token, nil)

	for i := 0; i < 5; i++ {
		if localTargetAddr != nil {
			n.conn.WriteToUDP(punchPkt, localTargetAddr)
		}
		if targetAddr != nil {
			n.conn.WriteToUDP(punchPkt, targetAddr)
		}
		time.Sleep(150 * time.Millisecond)
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

// BroadcastFileAnnounce informs the target peer that a new file is available in the Vault
func (n *P2PNode) BroadcastFileAnnounce(fileHash, title string, sizeBytes int64, mimeType string) {
	log.Printf("[Go P2P] Broadcasting file announce for '%s' (Hash: %s) to peer '%s'...\n", title, fileHash[:8], n.targetID)
	n.SendMessage(map[string]interface{}{
		"cmd":   "file_announce",
		"hash":  fileHash,
		"title": title,
		"size":  float64(sizeBytes),
		"mime":  mimeType,
	})
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
		case "LAN_ANNOUNCE":
			if pkt.Token == n.token && pkt.Sender == n.targetID {
				portNum, _ := pkt.Payload["port"].(float64)
				localPeerAddr, err := net.ResolveUDPAddr("udp", fmt.Sprintf("%s:%d", raddr.IP.String(), int(portNum)))
				if err == nil {
					n.peerAddrMutex.Lock()
					alreadyDirect := n.isDirect && n.peerAddr != nil && n.peerAddr.String() == localPeerAddr.String()
					n.peerAddr = localPeerAddr
					n.isDirect = true
					n.peerAddrMutex.Unlock()
					if !alreadyDirect {
						log.Printf("[Go P2P] Discovered local LAN peer '%s' at %s! Mode: DIRECT_LAN (1-5ms)\n", pkt.Sender, localPeerAddr)
					}
					select {
					case n.punchAckChan <- true:
					default:
					}
				}
			}

		case "REGISTER_ACK":
			select {
			case n.registeredChan <- true:
			default:
			}

		case "PEER_INFO":
			ipStr, _ := pkt.Payload["ip"].(string)
			portNum, _ := pkt.Payload["port"].(float64)
			localIP, _ := pkt.Payload["local_ip"].(string)
			localPortNum, _ := pkt.Payload["local_port"].(float64)
			targetID, _ := pkt.Payload["target_id"].(string)

			if targetID == n.targetID {
				n.peerAddrMutex.Lock()
				if localIP != "" && localPortNum > 0 {
					laddr, err := net.ResolveUDPAddr("udp", fmt.Sprintf("%s:%d", localIP, int(localPortNum)))
					if err == nil {
						n.localPeerAddr = laddr
					}
				}
				if ipStr != "" {
					addr, err := net.ResolveUDPAddr("udp", fmt.Sprintf("%s:%d", ipStr, int(portNum)))
					if err == nil {
						n.peerAddr = addr
					}
				}
				n.peerAddrMutex.Unlock()
				select {
				case n.peerDiscovChan <- true:
				default:
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

				switch cmd {
				case "ping":
					n.SendMessage(map[string]interface{}{"resp": "ping", "time": decPayload["time"]})

				case "file_announce":
					fileHash, _ := decPayload["hash"].(string)
					title, _ := decPayload["title"].(string)
					sizeFloat, _ := decPayload["size"].(float64)
					mime, _ := decPayload["mime"].(string)

					log.Printf("\n📦 [%s] Received P2P File Announcement from '%s': '%s' (%s)\n", modeStr, pkt.Sender, title, fileHash[:8])

					// Check if file is already present in local Vault
					if n.fileService != nil {
						_, err := n.fileService.ReadFile(fileHash, false)
						if err != nil {
							// File is missing -> Request transfer from peer
							log.Printf("[Go P2P] File '%s' not present in local vault. Requesting transfer from '%s'...\n", title, pkt.Sender)
							n.SendMessage(map[string]interface{}{
								"cmd":   "file_request",
								"hash":  fileHash,
								"title": title,
								"mime":  mime,
								"size":  sizeFloat,
							})
						} else {
							log.Printf("[Go P2P] File '%s' already exists in local vault. Skipping download.\n", title)
						}
					}

				case "file_request":
					fileHash, _ := decPayload["hash"].(string)
					title, _ := decPayload["title"].(string)
					mime, _ := decPayload["mime"].(string)

					log.Printf("[Go P2P] Peer '%s' requested file '%s' (%s). Sending content over P2P...\n", pkt.Sender, title, fileHash[:8])
					if n.fileService != nil {
						dataBytes, err := n.fileService.ReadFile(fileHash, false)
						if err == nil {
							b64Data := base64.StdEncoding.EncodeToString(dataBytes)
							n.SendMessage(map[string]interface{}{
								"cmd":   "file_chunk",
								"hash":  fileHash,
								"title": title,
								"mime":  mime,
								"data":  b64Data,
							})
							log.Printf("[Go P2P] Successfully sent P2P file payload for '%s' to '%s'.\n", title, pkt.Sender)
						} else {
							log.Printf("[Go P2P] Failed to read file for transfer: %v\n", err)
						}
					}

				case "file_chunk":
					fileHash, _ := decPayload["hash"].(string)
					title, _ := decPayload["title"].(string)
					mime, _ := decPayload["mime"].(string)
					b64Data, _ := decPayload["data"].(string)

					log.Printf("[Go P2P] Receiving file chunk for '%s' (hash: %s)...\n", title, fileHash)

					fileBytes, err := base64.StdEncoding.DecodeString(b64Data)
					if err == nil && n.fileService != nil {
						reader := bytes.NewReader(fileBytes)
						savedHash, relPath, sizeBytes, sig, saveErr := n.fileService.SaveFile(reader, false)
						if saveErr == nil {
							log.Printf("\n⚡ [%s] P2P File Auto-Synced Successfully! '%s' saved to vault (%s, %d bytes)\n", modeStr, title, savedHash[:8], sizeBytes)
							if n.repo != nil {
								item := models.Item{
									Title:       title,
									Description: fmt.Sprintf("Auto-synced via P2P from node '%s'", pkt.Sender),
									ItemType:    "asset",
									MimeType:    mime,
									SizeBytes:   sizeBytes,
									FilePath:    relPath,
									FileHash:    savedHash,
									IsEncrypted: false,
									DigitalSig:  sig,
								}
								_ = n.repo.CreateItem(&item)
								_ = n.repo.LogEvent("p2p_file_synced", fmt.Sprintf("Synced file '%s' from '%s'", title, pkt.Sender), "")
							}
						} else {
							log.Printf("[Go P2P] Failed to save synced file: %v\n", saveErr)
						}
					}

				default:
					if resp == "ping" {
						sentTime, _ := decPayload["time"].(float64)
						latency := float64(time.Now().UnixNano())/1e6 - (sentTime * 1000)
						fmt.Printf("\n🏓 [%s] Pong from %s! Latency: %.2f ms\n%s> ", modeStr, pkt.Sender, latency, n.nodeID)
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
}
