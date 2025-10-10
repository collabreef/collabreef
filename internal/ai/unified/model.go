package unified

// AIModel represents a unified AI model across all modalities
type AIModel struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	Provider   string   `json:"provider"`
	Modalities []string `json:"modalities"` // e.g., ["text2text", "textimage2text"]
}

// AIGenerateRequest is a unified request structure for all AI modalities
type AIGenerateRequest struct {
	Modality     string   `json:"modality" validate:"required"` // "text2text", "text2image", "textimage2text", "textimage2image"
	Provider     string   `json:"provider" validate:"required"`
	Model        string   `json:"model" validate:"required"`
	Prompt       string   `json:"prompt" validate:"required"`
	SystemPrompt *string  `json:"system_prompt,omitempty"`
	ImageURLs    []string `json:"image_urls,omitempty"`
	ImageBase64s []string `json:"image_base64s,omitempty"`
	MaskURL      *string  `json:"mask_url,omitempty"`
	MaskBase64   *string  `json:"mask_base64,omitempty"`
	Temperature  *float32 `json:"temperature,omitempty"`
	MaxTokens    *int     `json:"max_tokens,omitempty"`
	Size         *string  `json:"size,omitempty"`
	Quality      *string  `json:"quality,omitempty"`
	Style        *string  `json:"style,omitempty"`
	N            *int     `json:"n,omitempty"`
}

// AIGenerateResponse is a unified response structure
type AIGenerateResponse struct {
	Modality string  `json:"modality"`
	Text     *string `json:"text,omitempty"`     // For text outputs
	ImageURL *string `json:"image_url,omitempty"` // For image outputs
}