package api

import (
	"fmt"
	"io/fs"
	"testing"
)

func TestEmbeddedDist(t *testing.T) {
	subFS, err := fs.Sub(embeddedDist, "dist")
	if err != nil {
		t.Fatalf("fs.Sub failed: %v", err)
	}
	f, err := subFS.Open("index.html")
	if err != nil {
		t.Fatalf("subFS.Open index.html failed: %v", err)
	}
	defer f.Close()

	stat, _ := f.Stat()
	fmt.Printf("Successfully opened index.html, size: %d bytes\n", stat.Size())
}
