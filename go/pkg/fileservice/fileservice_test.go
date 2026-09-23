package fileservice

import (
	"bytes"
	"os"
	"testing"
)

func TestFileServiceShardingAndEncryption(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "vault_test_*")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpDir)

	fs, err := NewFileService(tmpDir, "test_secret_key_123")
	if err != nil {
		t.Fatalf("NewFileService failed: %v", err)
	}

	content := []byte("Hello PersonalVault in Pure Go!")
	r := bytes.NewReader(content)

	// Save encrypted file
	hash, relPath, sizeBytes, sig, err := fs.SaveFile(r, true)
	if err != nil {
		t.Fatalf("SaveFile failed: %v", err)
	}

	if hash == "" || relPath == "" || sizeBytes != int64(len(content)) || sig == "" {
		t.Errorf("Invalid SaveFile metadata output: hash=%s, relPath=%s, size=%d, sig=%s", hash, relPath, sizeBytes, sig)
	}

	// Read and Decrypt
	readData, err := fs.ReadFile(hash, true)
	if err != nil {
		t.Fatalf("ReadFile failed: %v", err)
	}

	if !bytes.Equal(readData, content) {
		t.Errorf("Decrypted data mismatch: got %s, want %s", string(readData), string(content))
	}
}
