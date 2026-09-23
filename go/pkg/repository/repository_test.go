package repository

import (
	"os"
	"testing"

	"github.com/GFPC/Enywheria/pkg/db"
	"github.com/GFPC/Enywheria/pkg/models"
)

func TestRepositoryCRUDAndFTS5(t *testing.T) {
	tmpFile, err := os.CreateTemp("", "vault_db_*.db")
	if err != nil {
		t.Fatal(err)
	}
	tmpPath := tmpFile.Name()
	tmpFile.Close()
	defer os.Remove(tmpPath)

	database, err := db.InitDB(tmpPath)
	if err != nil {
		t.Fatalf("InitDB failed: %v", err)
	}
	defer database.Close()

	repo := NewRepository(database)

	// Create Item
	item := models.Item{
		Title:       "Antigravity Agent Architecture Documentation",
		Description: "Detailed technical specification for Google Antigravity P2P vault",
		ItemType:    "document",
		MimeType:    "text/markdown",
		SizeBytes:   1024,
	}
	if err := repo.CreateItem(&item); err != nil {
		t.Fatalf("CreateItem failed: %v", err)
	}

	if item.ID == 0 {
		t.Errorf("Expected non-zero item ID")
	}

	// Fetch Item
	fetched, err := repo.GetItem(item.ID)
	if err != nil {
		t.Fatalf("GetItem failed: %v", err)
	}
	if fetched.Title != item.Title {
		t.Errorf("Title mismatch: got %s, want %s", fetched.Title, item.Title)
	}

	// Test FTS5 Search
	results, err := repo.SearchFTS5("Antigravity", 10)
	if err != nil {
		t.Fatalf("SearchFTS5 failed: %v", err)
	}

	if len(results) == 0 {
		t.Errorf("Expected FTS5 search results for 'Antigravity', got 0")
	}

	// Test Soft Delete
	if err := repo.SoftDeleteItem(item.ID); err != nil {
		t.Fatalf("SoftDeleteItem failed: %v", err)
	}

	_, err = repo.GetItem(item.ID)
	if err == nil {
		t.Errorf("Expected error fetching soft-deleted item, got nil")
	}
}
