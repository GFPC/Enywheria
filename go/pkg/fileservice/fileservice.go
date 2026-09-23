package fileservice

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/hex"
	"encoding/pem"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

type FileService struct {
	baseDir  string
	keysDir  string
	privKey  *ecdsa.PrivateKey
	secretKey []byte
}

func NewFileService(baseDir string, secretKeyStr string) (*FileService, error) {
	filesDir := filepath.Join(baseDir, "files")
	keysDir := filepath.Join(baseDir, "keys")

	if err := os.MkdirAll(filesDir, 0755); err != nil {
		return nil, err
	}
	if err := os.MkdirAll(keysDir, 0755); err != nil {
		return nil, err
	}

	// Derive 32-byte AES key from secretKeyStr
	h := sha256.Sum256([]byte(secretKeyStr))
	secretKey := h[:]

	privKey, err := loadOrGenerateECDSAKey(filepath.Join(keysDir, "vault_ecdsa.pem"))
	if err != nil {
		return nil, err
	}

	return &FileService{
		baseDir:   filesDir,
		keysDir:   keysDir,
		privKey:   privKey,
		secretKey: secretKey,
	}, nil
}

func (fs *FileService) SaveFile(r io.Reader, encrypt bool) (fileHash string, relPath string, sizeBytes int64, sig string, err error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return "", "", 0, "", fmt.Errorf("read file failed: %w", err)
	}

	hashBytes := sha256.Sum256(data)
	fileHash = hex.EncodeToString(hashBytes[:])
	sizeBytes = int64(len(data))

	// ECDSA Sign
	sigBytes, err := ecdsa.SignASN1(rand.Reader, fs.privKey, hashBytes[:])
	if err == nil {
		sig = hex.EncodeToString(sigBytes)
	}

	targetData := data
	if encrypt {
		encData, err := fs.EncryptBytes(data)
		if err != nil {
			return "", "", 0, "", fmt.Errorf("encryption failed: %w", err)
		}
		targetData = encData
	}

	subDir := fileHash[:2]
	dirPath := filepath.Join(fs.baseDir, subDir)
	if err := os.MkdirAll(dirPath, 0755); err != nil {
		return "", "", 0, "", err
	}

	fullPath := filepath.Join(dirPath, fileHash)
	relPath = filepath.Join("files", subDir, fileHash)

	// Deduplication check: if file already exists, skip writing
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		if err := os.WriteFile(fullPath, targetData, 0644); err != nil {
			return "", "", 0, "", fmt.Errorf("write file failed: %w", err)
		}
	}

	return fileHash, relPath, sizeBytes, sig, nil
}

func (fs *FileService) ReadFile(fileHash string, isEncrypted bool) ([]byte, error) {
	subDir := fileHash[:2]
	fullPath := filepath.Join(fs.baseDir, subDir, fileHash)

	data, err := os.ReadFile(fullPath)
	if err != nil {
		return nil, fmt.Errorf("file not found: %w", err)
	}

	if isEncrypted {
		decData, err := fs.DecryptBytes(data)
		if err != nil {
			return nil, fmt.Errorf("decryption failed: %w", err)
		}
		return decData, nil
	}

	return data, nil
}

func (fs *FileService) EncryptBytes(plainText []byte) ([]byte, error) {
	block, err := aes.NewCipher(fs.secretKey)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}

	cipherText := gcm.Seal(nonce, nonce, plainText, nil)
	return cipherText, nil
}

func (fs *FileService) DecryptBytes(cipherText []byte) ([]byte, error) {
	block, err := aes.NewCipher(fs.secretKey)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonceSize := gcm.NonceSize()
	if len(cipherText) < nonceSize {
		return nil, fmt.Errorf("ciphertext too short")
	}

	nonce, actualCipher := cipherText[:nonceSize], cipherText[nonceSize:]
	plainText, err := gcm.Open(nil, nonce, actualCipher, nil)
	if err != nil {
		return nil, err
	}

	return plainText, nil
}

func loadOrGenerateECDSAKey(path string) (*ecdsa.PrivateKey, error) {
	if data, err := os.ReadFile(path); err == nil {
		block, _ := pem.Decode(data)
		if block != nil {
			key, err := x509.ParseECPrivateKey(block.Bytes)
			if err == nil {
				return key, nil
			}
		}
	}

	privKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return nil, err
	}

	derBytes, err := x509.MarshalECPrivateKey(privKey)
	if err == nil {
		pemBlock := &pem.Block{
			Type:  "EC PRIVATE KEY",
			Bytes: derBytes,
		}
		_ = os.WriteFile(path, pem.EncodeToMemory(pemBlock), 0600)
	}

	return privKey, nil
}
