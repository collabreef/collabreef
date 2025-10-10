package text2image

type Model struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Provider string `json:"provider"`
}

type GenerateRequest struct {
	Provider string  `json:"provider" validate:"required"`
	Model    string  `json:"model" validate:"required"`
	Prompt   string  `json:"prompt" validate:"required"`
	Size     *string `json:"size,omitempty"`     // e.g., "1024x1024", "1792x1024"
	Quality  *string `json:"quality,omitempty"`  // e.g., "standard", "hd"
	Style    *string `json:"style,omitempty"`    // e.g., "vivid", "natural"
	N        *int    `json:"n,omitempty"`        // number of images to generate
}

type GenerateResponse struct {
	ImageURL string `json:"image_url"` // URL to the generated image
}