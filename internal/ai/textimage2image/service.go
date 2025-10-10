package textimage2image

import "fmt"

type Service struct {
	providers map[string]Provider
}

func NewService(providers ...Provider) *Service {
	m := make(map[string]Provider)
	for _, p := range providers {
		m[p.Name()] = p
	}
	return &Service{providers: m}
}

func (s *Service) ListModels() ([]Model, error) {
	var all []Model
	for _, p := range s.providers {
		models, err := p.ListModels()
		if err != nil {
			return nil, err
		}
		all = append(all, models...)
	}
	return all, nil
}

func (s *Service) Generate(req GenerateRequest) (*GenerateResponse, error) {
	p, ok := s.providers[req.Provider]
	if !ok {
		return nil, fmt.Errorf("provider not found: %s", req.Provider)
	}
	return p.Generate(req)
}