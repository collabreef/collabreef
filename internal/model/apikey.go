package model

type APIKeyFilter struct {
	UserID string
	ID     string
	Prefix string
}

type APIKey struct {
	ID         string `json:"id"`
	UserID     string `json:"user_id"`
	Name       string `json:"name"`
	KeyHash    string `json:"-"` // Never expose hash in JSON
	Prefix     string `json:"prefix"`
	LastUsedAt string `json:"last_used_at"`
	ExpiresAt  string `json:"expires_at"`
	CreatedAt  string `json:"created_at"`
	CreatedBy  string `json:"created_by"`
}

// APIKeyResponse is what we return to clients (masked key)
type APIKeyResponse struct {
	ID         string `json:"id"`
	UserID     string `json:"user_id"`
	Name       string `json:"name"`
	Prefix     string `json:"prefix"`
	LastUsedAt string `json:"last_used_at"`
	ExpiresAt  string `json:"expires_at"`
	CreatedAt  string `json:"created_at"`
}

// APIKeyCreationResponse includes the full key (only returned once)
type APIKeyCreationResponse struct {
	APIKeyResponse
	FullKey string `json:"full_key"` // Only included on creation
}
