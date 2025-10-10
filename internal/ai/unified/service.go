package unified

import (
	"fmt"

	"github.com/unsealdev/unseal/internal/ai/text2image"
	"github.com/unsealdev/unseal/internal/ai/text2text"
	"github.com/unsealdev/unseal/internal/ai/textimage2image"
	"github.com/unsealdev/unseal/internal/ai/textimage2text"
)

type Service struct {
	text2textService       *text2text.Service
	text2imageService      *text2image.Service
	textimage2textService  *textimage2text.Service
	textimage2imageService *textimage2image.Service
}

func NewService(
	text2textSvc *text2text.Service,
	text2imageSvc *text2image.Service,
	textimage2textSvc *textimage2text.Service,
	textimage2imageSvc *textimage2image.Service,
) *Service {
	return &Service{
		text2textService:       text2textSvc,
		text2imageService:      text2imageSvc,
		textimage2textService:  textimage2textSvc,
		textimage2imageService: textimage2imageSvc,
	}
}

func (s *Service) ListModels() ([]AIModel, error) {
	var allModels []AIModel

	// Get text2text models
	if s.text2textService != nil {
		models, err := s.text2textService.ListModels()
		if err == nil {
			for _, m := range models {
				allModels = append(allModels, AIModel{
					ID:         m.ID,
					Name:       m.Name,
					Provider:   m.Provider,
					Modalities: []string{"text2text"},
				})
			}
		}
	}

	// Get text2image models
	if s.text2imageService != nil {
		models, err := s.text2imageService.ListModels()
		if err == nil {
			for _, m := range models {
				allModels = append(allModels, AIModel{
					ID:         m.ID,
					Name:       m.Name,
					Provider:   m.Provider,
					Modalities: []string{"text2image"},
				})
			}
		}
	}

	// Get textimage2text models
	if s.textimage2textService != nil {
		models, err := s.textimage2textService.ListModels()
		if err == nil {
			for _, m := range models {
				allModels = append(allModels, AIModel{
					ID:         m.ID,
					Name:       m.Name,
					Provider:   m.Provider,
					Modalities: []string{"textimage2text"},
				})
			}
		}
	}

	// Get textimage2image models
	if s.textimage2imageService != nil {
		models, err := s.textimage2imageService.ListModels()
		if err == nil {
			for _, m := range models {
				allModels = append(allModels, AIModel{
					ID:         m.ID,
					Name:       m.Name,
					Provider:   m.Provider,
					Modalities: []string{"textimage2image"},
				})
			}
		}
	}

	return allModels, nil
}

func (s *Service) Generate(req AIGenerateRequest) (*AIGenerateResponse, error) {
	switch req.Modality {
	case "text2text":
		if s.text2textService == nil {
			return nil, fmt.Errorf("text2text service not available")
		}
		resp, err := s.text2textService.Generate(text2text.GenerateRequest{
			Provider:     req.Provider,
			Model:        req.Model,
			Prompt:       req.Prompt,
			SystemPrompt: req.SystemPrompt,
			Temperature:  req.Temperature,
			MaxTokens:    req.MaxTokens,
		})
		if err != nil {
			return nil, err
		}
		return &AIGenerateResponse{
			Modality: "text2text",
			Text:     &resp.Output,
		}, nil

	case "text2image":
		if s.text2imageService == nil {
			return nil, fmt.Errorf("text2image service not available")
		}
		resp, err := s.text2imageService.Generate(text2image.GenerateRequest{
			Provider: req.Provider,
			Model:    req.Model,
			Prompt:   req.Prompt,
			Size:     req.Size,
			Quality:  req.Quality,
			Style:    req.Style,
			N:        req.N,
		})
		if err != nil {
			return nil, err
		}
		return &AIGenerateResponse{
			Modality: "text2image",
			ImageURL: &resp.ImageURL,
		}, nil

	case "textimage2text":
		if s.textimage2textService == nil {
			return nil, fmt.Errorf("textimage2text service not available")
		}
		resp, err := s.textimage2textService.Generate(textimage2text.GenerateRequest{
			Provider:     req.Provider,
			Model:        req.Model,
			Prompt:       req.Prompt,
			ImageURLs:    req.ImageURLs,
			ImageBase64s: req.ImageBase64s,
			SystemPrompt: req.SystemPrompt,
			Temperature:  req.Temperature,
			MaxTokens:    req.MaxTokens,
		})
		if err != nil {
			return nil, err
		}
		return &AIGenerateResponse{
			Modality: "textimage2text",
			Text:     &resp.Output,
		}, nil

	case "textimage2image":
		if s.textimage2imageService == nil {
			return nil, fmt.Errorf("textimage2image service not available")
		}
		var imageURL, maskURL *string
		if len(req.ImageURLs) > 0 {
			imageURL = &req.ImageURLs[0]
		}
		var imageBase64 *string
		if len(req.ImageBase64s) > 0 {
			imageBase64 = &req.ImageBase64s[0]
		}
		if req.MaskURL != nil {
			maskURL = req.MaskURL
		}

		resp, err := s.textimage2imageService.Generate(textimage2image.GenerateRequest{
			Provider:    req.Provider,
			Model:       req.Model,
			Prompt:      req.Prompt,
			ImageURL:    imageURL,
			ImageBase64: imageBase64,
			MaskURL:     maskURL,
			MaskBase64:  req.MaskBase64,
			Size:        req.Size,
			Quality:     req.Quality,
			Style:       req.Style,
			N:           req.N,
		})
		if err != nil {
			return nil, err
		}
		return &AIGenerateResponse{
			Modality: "textimage2image",
			ImageURL: &resp.ImageURL,
		}, nil

	default:
		return nil, fmt.Errorf("unsupported modality: %s", req.Modality)
	}
}