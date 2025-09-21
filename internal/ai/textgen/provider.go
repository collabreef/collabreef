package textgen

type Provider interface {
	Name() string
	ListModels() ([]Model, error)
	Generate(req GenerateRequest) (*GenerateResponse, error)
}
