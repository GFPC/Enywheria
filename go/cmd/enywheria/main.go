package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/GFPC/Enywheria/pkg/api"
	"github.com/GFPC/Enywheria/pkg/db"
	"github.com/GFPC/Enywheria/pkg/fileservice"
	"github.com/GFPC/Enywheria/pkg/repository"
)

func main() {
	if len(os.Args) < 2 {
		printMainUsage()
		os.Exit(1)
	}

	cmd := strings.ToLower(os.Args[1])

	switch cmd {
	case "server", "web":
		runServerCmd(os.Args[2:])
	case "version":
		fmt.Println("Enywheria PersonalVault v0.1.0 (Standalone Go Build)")
	default:
		// Default to server if subcommand not recognized
		printMainUsage()
	}
}

func printMainUsage() {
	fmt.Println("🚀 Enywheria PersonalVault (Go Standalone Suite)")
	fmt.Println("Usage:")
	fmt.Println("  enywheria server [--port 8000] [--data ./data]")
	fmt.Println("  enywheria version")
}

func runServerCmd(args []string) {
	port := 8000
	dataDir := "./data"

	for i := 0; i < len(args); i++ {
		arg := args[i]
		if (arg == "--port" || arg == "-p") && i+1 < len(args) {
			fmt.Sscanf(args[i+1], "%d", &port)
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
	fs, err := fileservice.NewFileService(dataDir, "SECRET_VAULT_KEY")
	if err != nil {
		log.Fatalf("FileService initialization failed: %v", err)
	}

	server := api.NewServer(repo, fs)
	mux := http.NewServeMux()
	server.RegisterRoutes(mux)

	addr := fmt.Sprintf("0.0.0.0:%d", port)
	log.Printf("=======================================================\n")
	log.Printf("🚀 PersonalVault Server Running on http://localhost:%d\n", port)
	log.Printf("REST API: http://localhost:%d/api/v1/health\n", port)
	log.Printf("=======================================================\n")

	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server stopped: %v", err)
	}
}
