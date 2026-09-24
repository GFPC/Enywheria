package main

import (
	"bufio"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/GFPC/Enywheria/pkg/api"
	"github.com/GFPC/Enywheria/pkg/db"
	"github.com/GFPC/Enywheria/pkg/fileservice"
	"github.com/GFPC/Enywheria/pkg/p2pnode"
	"github.com/GFPC/Enywheria/pkg/relay"
	"github.com/GFPC/Enywheria/pkg/repository"
)

func main() {
	if len(os.Args) < 2 {
		// Default behavior: launch unified server mode if no args provided
		runServerCmd(nil)
		return
	}

	cmd := strings.ToLower(os.Args[1])

	switch cmd {
	case "server", "web":
		runServerCmd(os.Args[2:])
	case "node", "p2p":
		runP2PNodeCmd(os.Args[2:])
	case "relay", "stun":
		runRelayCmd(os.Args[2:])
	case "version", "-v", "--version":
		fmt.Println("Enywheria PersonalVault v0.2.0 (Unified Pure Go Binary)")
	case "help", "-h", "--help":
		printMainUsage()
	default:
		// If first argument looks like a flag (e.g. --port 8000), default to server mode
		if strings.HasPrefix(cmd, "-") {
			runServerCmd(os.Args[1:])
		} else {
			printMainUsage()
		}
	}
}

func printMainUsage() {
	fmt.Println("🚀 Enywheria PersonalVault (Unified Single Binary)")
	fmt.Println("\nUsage:")
	fmt.Println("  enywheria [server] [--port 8000] [--data ./data] [--node pc] [--target phone] [--relay 89.125.140.47:9000]")
	fmt.Println("  enywheria p2p      --node phone --target pc [--relay 89.125.140.47:9000]")
	fmt.Println("  enywheria relay    [--host 0.0.0.0] [--port 9000]")
	fmt.Println("  enywheria version")
}

func runServerCmd(args []string) {
	port := 8000
	dataDir := "./data"
	nodeID := "pc"
	targetID := "phone"
	relayAddr := "89.125.140.47:9000"
	token := "default_p2p_token"
	p2pPort := 0
	noP2P := false

	for i := 0; i < len(args); i++ {
		arg := args[i]
		if (arg == "--port" || arg == "-p") && i+1 < len(args) {
			fmt.Sscanf(args[i+1], "%d", &port)
			i++
		} else if (arg == "--data" || arg == "-d") && i+1 < len(args) {
			dataDir = args[i+1]
			i++
		} else if (arg == "--node" || arg == "-n") && i+1 < len(args) {
			nodeID = args[i+1]
			i++
		} else if (arg == "--target" || arg == "-t") && i+1 < len(args) {
			targetID = args[i+1]
			i++
		} else if (arg == "--relay" || arg == "-r") && i+1 < len(args) {
			relayAddr = args[i+1]
			i++
		} else if (arg == "--token" || arg == "-k") && i+1 < len(args) {
			token = args[i+1]
			i++
		} else if arg == "--p2p-port" && i+1 < len(args) {
			fmt.Sscanf(args[i+1], "%d", &p2pPort)
			i++
		} else if arg == "--no-p2p" {
			noP2P = true
		}
	}

	dbPath := filepath.Join(dataDir, "vault.db")
	database, err := db.InitDB(dbPath)
	if err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}
	defer database.Close()

	repo := repository.NewRepository(database)
	fs, err := fileservice.NewFileService(dataDir, token)
	if err != nil {
		log.Fatalf("FileService initialization failed: %v", err)
	}

	server := api.NewServer(repo, fs)

	if !noP2P {
		node, err := p2pnode.NewP2PNode(nodeID, targetID, relayAddr, token, p2pPort, fs, repo)
		if err == nil {
			node.Start()
			go node.ConnectPeer()
			server.SetP2PNode(node)
			log.Printf("[Go P2P] Background P2P Engine Active! (Node: %s -> Target: %s)\n", nodeID, targetID)
		} else {
			log.Printf("[Go P2P] Warning: Could not start P2P background engine: %v\n", err)
		}
	}

	mux := http.NewServeMux()
	server.RegisterRoutes(mux)

	addr := fmt.Sprintf("0.0.0.0:%d", port)
	log.Printf("=======================================================\n")
	log.Printf("🚀 Enywheria PersonalVault Server Running on http://localhost:%d\n", port)
	log.Printf("Enterprise SaaS UI Embedded: http://localhost:%d/\n", port)
	log.Printf("=======================================================\n")

	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server stopped: %v", err)
	}
}

func runP2PNodeCmd(args []string) {
	nodeID := "phone"
	targetID := "pc"
	relayAddr := "89.125.140.47:9000"
	token := "default_p2p_token"
	localPort := 0
	dataDir := "./data"

	for i := 0; i < len(args); i++ {
		arg := args[i]
		if (arg == "--node" || arg == "-n") && i+1 < len(args) {
			nodeID = args[i+1]
			i++
		} else if (arg == "--target" || arg == "-t") && i+1 < len(args) {
			targetID = args[i+1]
			i++
		} else if (arg == "--relay" || arg == "-r") && i+1 < len(args) {
			relayAddr = args[i+1]
			i++
		} else if (arg == "--token" || arg == "-k") && i+1 < len(args) {
			token = args[i+1]
			i++
		} else if (arg == "--port" || arg == "-p") && i+1 < len(args) {
			fmt.Sscanf(args[i+1], "%d", &localPort)
			i++
		} else if (arg == "--data" || arg == "-d") && i+1 < len(args) {
			dataDir = args[i+1]
			i++
		}
	}

	dbPath := filepath.Join(dataDir, "vault.db")
	database, err := db.InitDB(dbPath)
	if err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}
	defer database.Close()

	repo := repository.NewRepository(database)
	fs, err := fileservice.NewFileService(dataDir, token)
	if err != nil {
		log.Fatalf("FileService initialization failed: %v", err)
	}

	node, err := p2pnode.NewP2PNode(nodeID, targetID, relayAddr, token, localPort, fs, repo)
	if err != nil {
		log.Fatalf("P2P Node initialization failed: %v", err)
	}

	node.Start()
	node.ConnectPeer()

	fmt.Printf("\n=======================================================\n")
	fmt.Printf("🚀 Enywheria P2P Terminal Ready! Linked with '%s'\n", targetID)
	fmt.Printf("Commands: /ping, /help, exit\n")
	fmt.Printf("Automated P2P Vault File Receiver is ACTIVE.\n")
	fmt.Printf("=======================================================\n\n")

	scanner := bufio.NewScanner(os.Stdin)
	fmt.Printf("%s> ", nodeID)
	for scanner.Scan() {
		text := strings.TrimSpace(scanner.Text())
		if text == "" {
			fmt.Printf("%s> ", nodeID)
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

		fmt.Printf("%s> ", nodeID)
	}
}

func runRelayCmd(args []string) {
	host := "0.0.0.0"
	port := 9000
	token := "default_p2p_token"

	for i := 0; i < len(args); i++ {
		arg := args[i]
		if (arg == "--host" || arg == "-h") && i+1 < len(args) {
			host = args[i+1]
			i++
		} else if (arg == "--port" || arg == "-p") && i+1 < len(args) {
			fmt.Sscanf(args[i+1], "%d", &port)
			i++
		} else if (arg == "--token" || arg == "-k") && i+1 < len(args) {
			token = args[i+1]
			i++
		}
	}

	server := relay.NewRelayServer(token)
	if err := server.ListenAndServe(host, port); err != nil {
		log.Fatalf("Relay server error: %v", err)
	}
}
