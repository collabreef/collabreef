package util

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
)

const (
	APIKeyPrefix = "ntp_"
	APIKeyLength = 32 // characters after prefix
)

// GenerateAPIKey generates a new API key with format: ntp_<32-random-chars>
// Returns: fullKey, prefix (first 12 chars), error
func GenerateAPIKey() (string, string, error) {
	// Generate 16 random bytes = 32 hex characters
	randomBytes := make([]byte, 16)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", "", fmt.Errorf("failed to generate random bytes: %w", err)
	}

	randomString := hex.EncodeToString(randomBytes)
	fullKey := APIKeyPrefix + randomString

	// Prefix is first 12 characters (ntp_ + first 8 chars of random)
	prefix := fullKey[:12]

	return fullKey, prefix, nil
}

// ExtractPrefix extracts the prefix from a full API key
func ExtractPrefix(apiKey string) string {
	if len(apiKey) < 12 {
		return ""
	}
	return apiKey[:12]
}

// ValidateAPIKeyFormat checks if the API key has valid format
func ValidateAPIKeyFormat(apiKey string) bool {
	expectedLength := len(APIKeyPrefix) + APIKeyLength
	if len(apiKey) != expectedLength {
		return false
	}
	if apiKey[:len(APIKeyPrefix)] != APIKeyPrefix {
		return false
	}
	return true
}
