package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
)

func deriveAESKey(rawKeyStr string) []byte {
	rawBytes := []byte(rawKeyStr)
	decoded, err := base64.StdEncoding.DecodeString(rawKeyStr)
	if err == nil && len(decoded) == 32 {
		return decoded
	}
	hash := sha256.Sum256(rawBytes)
	return hash[:]
}

func EncryptData(data []byte, rawKeyStr string) ([]byte, error) {
	key := deriveAESKey(rawKeyStr)
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonce := make([]byte, aesgcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}

	ciphertext := aesgcm.Seal(nonce, nonce, data, nil)
	return ciphertext, nil
}

func DecryptData(encryptedData []byte, rawKeyStr string) ([]byte, error) {
	key := deriveAESKey(rawKeyStr)
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonceSize := aesgcm.NonceSize()
	if len(encryptedData) < nonceSize {
		return nil, errors.New("encrypted data too short")
	}

	nonce, ciphertext := encryptedData[:nonceSize], encryptedData[nonceSize:]
	plaintext, err := aesgcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, err
	}

	return plaintext, nil
}

func PackEncryptedPayload(sender, target string, payload interface{}, secretToken string, isRelay bool) ([]byte, error) {
	rawJSON, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	encBytes, err := EncryptData(rawJSON, secretToken)
	if err != nil {
		return nil, err
	}

	b64Payload := base64.StdEncoding.EncodeToString(encBytes)

	msgType := "DATA"
	if isRelay {
		msgType = "RELAY_DATA"
	}

	packet := map[string]interface{}{
		"type":   msgType,
		"sender": sender,
		"target": target,
		"token":  secretToken,
		"payload": map[string]string{
			"encrypted": b64Payload,
		},
	}

	return json.Marshal(packet)
}

func UnpackEncryptedPayload(payloadMap map[string]interface{}, secretToken string) (map[string]interface{}, error) {
	encStr, ok := payloadMap["encrypted"].(string)
	if !ok || encStr == "" {
		return nil, errors.New("missing encrypted field")
	}

	encBytes, err := base64.StdEncoding.DecodeString(encStr)
	if err != nil {
		return nil, err
	}

	decBytes, err := DecryptData(encBytes, secretToken)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(decBytes, &result); err != nil {
		return nil, err
	}

	return result, nil
}
