package model

type AIGeneration struct {
	ID        string `json:"id"`
	UserID    string `json:"user_id"`
	Modality  string `json:"modality"` // text2text, text2image, textimage2text, textimage2image
	Provider  string `json:"provider"`
	Model     string `json:"model"`
	CreatedAt string `json:"created_at"`

	// Request fields (stored as JSON or individual columns)
	RequestPrompt       string  `json:"request_prompt"`
	RequestSystemPrompt *string `json:"request_system_prompt,omitempty"`
	RequestImageURLs    *string `json:"request_image_urls,omitempty"`    // JSON array
	RequestMaskURL      *string `json:"request_mask_url,omitempty"`
	RequestTemperature  *float32 `json:"request_temperature,omitempty"`
	RequestMaxTokens    *int    `json:"request_max_tokens,omitempty"`
	RequestSize         *string `json:"request_size,omitempty"`
	RequestQuality      *string `json:"request_quality,omitempty"`
	RequestStyle        *string `json:"request_style,omitempty"`
	RequestN            *int    `json:"request_n,omitempty"`

	// Response fields
	ResponseText     *string `json:"response_text,omitempty"`
	ResponseImageURL *string `json:"response_image_url,omitempty"`

	// Error tracking
	ErrorMessage *string `json:"error_message,omitempty"`
}