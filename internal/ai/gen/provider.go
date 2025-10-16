package gen

// Provider defines the interface for generation providers
type Provider interface {
	// Name returns the provider name (e.g., "openai", "gemini")
	Name() string

	// Modality returns the modality this provider supports (e.g., "text2text", "text2image")
	Modality() string

	// ListModels returns available models for this provider
	ListModels() ([]Model, error)

	// Generate performs the generation
	Generate(req GenerateRequest) (*GenerateResponse, error)
}