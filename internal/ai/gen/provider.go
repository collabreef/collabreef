package gen

// Provider defines the interface for generation providers
// Note: Providers should NOT store API keys. API keys should be passed
// via GenerateRequest.APIKey at generation time for security.
type Provider interface {
	// Name returns the provider name (e.g., "openai", "gemini")
	Name() string

	// Modality returns the modality this provider supports (e.g., "text2text", "text2image")
	Modality() string

	// ListModels returns available models for this provider
	// Note: This may return a static list if API key is not available
	ListModels() ([]Model, error)

	// Generate performs the generation
	// The API key must be provided in req.APIKey
	Generate(req GenerateRequest) (*GenerateResponse, error)
}