package textimage2text

type Model struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Provider string `json:"provider"`
}

type GenerateRequest struct {
	Provider     string   `json:"provider" validate:"required"`
	Model        string   `json:"model" validate:"required"`
	Prompt       string   `json:"prompt" validate:"required"`
	ImageURLs    []string `json:"image_urls,omitempty"`    // URLs to images
	ImageBase64s []string `json:"image_base64s,omitempty"` // Base64 encoded images
	SystemPrompt *string  `json:"system_prompt,omitempty"`
	Temperature  *float32 `json:"temperature,omitempty"`
	MaxTokens    *int     `json:"max_tokens,omitempty"`
}

type GenerateResponse struct {
	Output string `json:"output"`
}
