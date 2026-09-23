package api

import (
	"embed"
	"encoding/json"
	"fmt"
	"html/template"
	"io/fs"
	"net/http"
	"strconv"
	"strings"

	"github.com/GFPC/Enywheria/pkg/fileservice"
	"github.com/GFPC/Enywheria/pkg/models"
	"github.com/GFPC/Enywheria/pkg/repository"
)

//go:embed dist/*
var embeddedDist embed.FS

type Server struct {
	repo *repository.Repository
	fs   *fileservice.FileService
}

func NewServer(repo *repository.Repository, fs *fileservice.FileService) *Server {
	return &Server{repo: repo, fs: fs}
}

func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

func (s *Server) RegisterRoutes(mux *http.ServeMux) {
	// Web UI SPA & Embedded Static Server
	subFS, err := fs.Sub(embeddedDist, "dist")
	if err == nil {
		fileServer := http.FileServer(http.FS(subFS))
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			if strings.HasPrefix(r.URL.Path, "/api/") {
				http.NotFound(w, r)
				return
			}
			path := strings.TrimPrefix(r.URL.Path, "/")
			if path == "" {
				path = "index.html"
			}
			f, err := subFS.Open(path)
			if err == nil {
				_ = f.Close()
				fileServer.ServeHTTP(w, r)
				return
			}
			// Fallback to index.html for SPA router
			r.URL.Path = "/"
			fileServer.ServeHTTP(w, r)
		})
	} else {
		mux.HandleFunc("/", s.handleDashboard)
	}

	// API Health
	mux.HandleFunc("/api/v1/health", withCORS(s.handleHealth))

	// API Items
	mux.HandleFunc("/api/v1/items", withCORS(s.handleItems))
	mux.HandleFunc("/api/v1/items/", withCORS(s.handleItemByID))

	// API Tags
	mux.HandleFunc("/api/v1/tags", withCORS(s.handleTags))

	// API Collections
	mux.HandleFunc("/api/v1/collections", withCORS(s.handleCollections))

	// API Projects
	mux.HandleFunc("/api/v1/projects", withCORS(s.handleProjects))

	// API Clients
	mux.HandleFunc("/api/v1/clients", withCORS(s.handleClients))

	// API Devices
	mux.HandleFunc("/api/v1/devices", withCORS(s.handleDevices))

	// API Scripts
	mux.HandleFunc("/api/v1/scripts", withCORS(s.handleScripts))

	// API Boxes
	mux.HandleFunc("/api/v1/boxes", withCORS(s.handleBoxes))

	// API Notes
	mux.HandleFunc("/api/v1/notes", withCORS(s.handleNotes))

	// API Events
	mux.HandleFunc("/api/v1/events", withCORS(s.handleEvents))

	// API Search
	mux.HandleFunc("/api/v1/search", withCORS(s.handleSearch))

	// API File Upload
	mux.HandleFunc("/api/v1/files/upload", withCORS(s.handleFileUpload))
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "healthy",
		"service": "Enywheria PersonalVault (Go)",
	})
}

func (s *Server) handleItems(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		items, err := s.repo.ListItems(50, 0)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, items)

	case http.MethodPost:
		var item models.Item
		if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json"})
			return
		}
		if err := s.repo.CreateItem(&item); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		_ = s.repo.LogEvent("item_created", fmt.Sprintf("Created item '%s'", item.Title), "")
		writeJSON(w, http.StatusCreated, item)

	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleItemByID(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/v1/items/")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid item id"})
		return
	}

	switch r.Method {
	case http.MethodGet:
		item, err := s.repo.GetItem(id)
		if err != nil {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "item not found"})
			return
		}
		writeJSON(w, http.StatusOK, item)

	case http.MethodDelete:
		if err := s.repo.SoftDeleteItem(id); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})

	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleTags(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		tags, err := s.repo.ListTags()
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, tags)
	} else if r.Method == http.MethodPost {
		var tag models.Tag
		_ = json.NewDecoder(r.Body).Decode(&tag)
		_ = s.repo.CreateTag(&tag)
		writeJSON(w, http.StatusCreated, tag)
	}
}

func (s *Server) handleCollections(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		cols, _ := s.repo.ListCollections()
		writeJSON(w, http.StatusOK, cols)
	} else if r.Method == http.MethodPost {
		var c models.Collection
		_ = json.NewDecoder(r.Body).Decode(&c)
		_ = s.repo.CreateCollection(&c)
		writeJSON(w, http.StatusCreated, c)
	}
}

func (s *Server) handleProjects(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		projects, _ := s.repo.ListProjects()
		writeJSON(w, http.StatusOK, projects)
	} else if r.Method == http.MethodPost {
		var p models.Project
		_ = json.NewDecoder(r.Body).Decode(&p)
		_ = s.repo.CreateProject(&p)
		writeJSON(w, http.StatusCreated, p)
	}
}

func (s *Server) handleClients(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		clients, _ := s.repo.ListClients()
		writeJSON(w, http.StatusOK, clients)
	} else if r.Method == http.MethodPost {
		var c models.Client
		_ = json.NewDecoder(r.Body).Decode(&c)
		_ = s.repo.CreateClient(&c)
		writeJSON(w, http.StatusCreated, c)
	}
}

func (s *Server) handleDevices(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		devices, _ := s.repo.ListDevices()
		writeJSON(w, http.StatusOK, devices)
	} else if r.Method == http.MethodPost {
		var d models.Device
		_ = json.NewDecoder(r.Body).Decode(&d)
		_ = s.repo.CreateDevice(&d)
		writeJSON(w, http.StatusCreated, d)
	}
}

func (s *Server) handleScripts(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		scripts, _ := s.repo.ListScripts()
		writeJSON(w, http.StatusOK, scripts)
	} else if r.Method == http.MethodPost {
		var scr models.Script
		_ = json.NewDecoder(r.Body).Decode(&scr)
		_ = s.repo.CreateScript(&scr)
		writeJSON(w, http.StatusCreated, scr)
	}
}

func (s *Server) handleBoxes(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		boxes, _ := s.repo.ListBoxes()
		writeJSON(w, http.StatusOK, boxes)
	} else if r.Method == http.MethodPost {
		var b models.Box
		_ = json.NewDecoder(r.Body).Decode(&b)
		_ = s.repo.CreateBox(&b)
		writeJSON(w, http.StatusCreated, b)
	}
}

func (s *Server) handleNotes(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		notes, _ := s.repo.ListNotes()
		writeJSON(w, http.StatusOK, notes)
	} else if r.Method == http.MethodPost {
		var n models.Note
		_ = json.NewDecoder(r.Body).Decode(&n)
		_ = s.repo.CreateNote(&n)
		writeJSON(w, http.StatusCreated, n)
	}
}

func (s *Server) handleEvents(w http.ResponseWriter, r *http.Request) {
	events, _ := s.repo.ListEvents(50)
	writeJSON(w, http.StatusOK, events)
}

func (s *Server) handleSearch(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if q == "" {
		writeJSON(w, http.StatusOK, []models.SearchResult{})
		return
	}

	results, err := s.repo.SearchFTS5(q, 20)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, results)
}

func (s *Server) handleFileUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "missing file field"})
		return
	}
	defer file.Close()

	encrypt := r.FormValue("encrypt") == "true"
	hash, relPath, sizeBytes, sig, err := s.fs.SaveFile(file, encrypt)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	item := models.Item{
		Title:       header.Filename,
		Description: fmt.Sprintf("Uploaded file (%d bytes)", sizeBytes),
		ItemType:    "asset",
		MimeType:    header.Header.Get("Content-Type"),
		SizeBytes:   sizeBytes,
		FilePath:    relPath,
		FileHash:    hash,
		IsEncrypted: encrypt,
		DigitalSig:  sig,
	}
	_ = s.repo.CreateItem(&item)
	_ = s.repo.LogEvent("file_uploaded", fmt.Sprintf("Uploaded file '%s' (%s)", header.Filename, hash[:8]), "")

	writeJSON(w, http.StatusCreated, item)
}

func (s *Server) handleDashboard(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	items, _ := s.repo.ListItems(10, 0)
	notes, _ := s.repo.ListNotes()
	events, _ := s.repo.ListEvents(10)

	tmplStr := `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Enywheria PersonalVault (Go Standalone)</title>
    <script src="https://unpkg.com/htmx.org@1.9.10"></script>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-gray-100 font-sans min-h-screen p-6">
    <div class="max-w-6xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h1 class="text-3xl font-bold text-indigo-400">⚡ Enywheria PersonalVault <span class="text-xs bg-indigo-950 text-indigo-300 px-2 py-1 rounded">Pure Go</span></h1>
            <input type="text" name="q" placeholder="Search vault assets..." 
                   hx-get="/api/v1/search" hx-trigger="keyup changed delay:300ms" hx-target="#search-results"
                   class="bg-gray-800 border border-gray-700 text-white rounded px-4 py-2 w-64 focus:outline-none focus:border-indigo-500">
        </div>

        <!-- Live Search Output -->
        <div id="search-results" class="empty:hidden bg-gray-800 border border-gray-700 rounded p-4"></div>

        <!-- Core Dashboard Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Recent Assets -->
            <div class="bg-gray-800 rounded-lg p-5 border border-gray-700">
                <h2 class="text-xl font-semibold text-indigo-300 mb-3">📁 Recent Assets</h2>
                <ul class="space-y-2 text-sm text-gray-300">
                    {{range .Items}}
                    <li class="p-2 bg-gray-900 rounded flex justify-between">
                        <span>{{.Title}}</span>
                        <span class="text-xs text-gray-500">{{.ItemType}}</span>
                    </li>
                    {{else}}
                    <li class="text-gray-500 italic">No assets stored yet.</li>
                    {{end}}
                </ul>
            </div>

            <!-- Notes -->
            <div class="bg-gray-800 rounded-lg p-5 border border-gray-700">
                <h2 class="text-xl font-semibold text-emerald-300 mb-3">📝 Notes</h2>
                <ul class="space-y-2 text-sm text-gray-300">
                    {{range .Notes}}
                    <li class="p-2 bg-gray-900 rounded">
                        <div class="font-medium text-emerald-400">{{.Title}}</div>
                        <div class="text-xs text-gray-400 truncate">{{.Content}}</div>
                    </li>
                    {{else}}
                    <li class="text-gray-500 italic">No notes created yet.</li>
                    {{end}}
                </ul>
            </div>

            <!-- Event Audit Log -->
            <div class="bg-gray-800 rounded-lg p-5 border border-gray-700">
                <h2 class="text-xl font-semibold text-amber-300 mb-3">📋 Audit Log</h2>
                <ul class="space-y-2 text-xs text-gray-400">
                    {{range .Events}}
                    <li class="p-2 bg-gray-900 rounded border-l-2 border-amber-500">
                        <div class="font-mono text-gray-300">{{.EventType}}: {{.Message}}</div>
                    </li>
                    {{else}}
                    <li class="text-gray-500 italic">No audit events recorded.</li>
                    {{end}}
                </ul>
            </div>
        </div>
    </div>
</body>
</html>
	`

	t, err := template.New("dashboard").Parse(tmplStr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = t.Execute(w, map[string]interface{}{
		"Items":  items,
		"Notes":  notes,
		"Events": events,
	})
}
