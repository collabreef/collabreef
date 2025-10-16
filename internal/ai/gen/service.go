package gen

import "fmt"

// Service manages multiple AI generation providers
type Service struct {
	providers map[string]Provider
}

// NewService creates a new AI generation service with the given providers
func NewService(providers ...Provider) *Service {
	m := make(map[string]Provider)
	for _, p := range providers {
		m[p.Name()] = p
	}
	return &Service{providers: m}
}

// ListModels returns all available models from all providers
func (s *Service) ListModels() ([]Model, error) {
	var all []Model
	for _, p := range s.providers {
		models, err := p.ListModels()
		if err != nil {
			return nil, fmt.Errorf("failed to list models from provider %s: %w", p.Name(), err)
		}
		all = append(all, models...)
	}
	return all, nil
}

// Generate performs AI generation using the specified provider
func (s *Service) Generate(req GenerateRequest) (*GenerateResponse, error) {
	p, ok := s.providers[req.Provider]
	if !ok {
		return nil, fmt.Errorf("provider not found: %s", req.Provider)
	}

	// Validate modality support
	if req.Modality != "" && p.Modality() != req.Modality {
		return nil, fmt.Errorf("provider %s does not support modality %s (supports: %s)",
			req.Provider, req.Modality, p.Modality())
	}

	return p.Generate(req)
}

// GetProvider returns a provider by name
func (s *Service) GetProvider(name string) (Provider, bool) {
	p, ok := s.providers[name]
	return p, ok
}

// ListProviders returns all registered provider names
func (s *Service) ListProviders() []string {
	names := make([]string, 0, len(s.providers))
	for name := range s.providers {
		names = append(names, name)
	}
	return names
}