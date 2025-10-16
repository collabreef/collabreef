package gen

// Model represents an AI model
type Model struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Provider    string `json:"provider"`
	Modality    string `json:"modality"`
	Description string `json:"description,omitempty"`
}

// GenerateRequest represents a generation request
type GenerateRequest struct {
	Provider string   `json:"provider"`
	Model    string   `json:"model"`
	Modality string   `json:"modality"`
	Prompt   string   `json:"prompt"`
	Images   []string `json:"images,omitempty"`
	// API key for the provider (provided at generation time for security)
	APIKey string `json:"-"` // Never expose in JSON
	// Additional parameters can be added here
	MaxTokens   int     `json:"max_tokens,omitempty"`
	Temperature float64 `json:"temperature,omitempty"`
}

// GenerateResponse represents a generation response
type GenerateResponse struct {
	Content string `json:"content"`
	// Additional response fields can be added here
	Model        string `json:"model,omitempty"`
	FinishReason string `json:"finish_reason,omitempty"`
}