package gemini

import (
	"context"
	"fmt"

	"github.com/unsealdev/unseal/internal/ai/gen"
	"google.golang.org/genai"
)

type GeminiProvider struct{}

func NewGeminiProvider() *GeminiProvider {
	return &GeminiProvider{}
}

func (p *GeminiProvider) Name() string {
	return "gemini"
}

func (p *GeminiProvider) Modality() string {
	// Gemini supports text-to-text and text+image-to-text (multimodal)
	return "text2text,textimage2text"
}

func (p *GeminiProvider) ListModels() ([]gen.Model, error) {
	var models []gen.Model

	// Hardcoded list of available Gemini models
	// TODO: Implement dynamic model listing when API supports it
	models = append(models, gen.Model{
		ID:          "gemini-2.5-pro",
		Name:        "Gemini 2.5 Pro",
		Provider:    p.Name(),
		Modality:    "textimage2text",
		Description: "Most capable Gemini model with multimodal support",
	})
	models = append(models, gen.Model{
		ID:          "gemini-2.5-flash",
		Name:        "Gemini 2.5 Flash",
		Provider:    p.Name(),
		Modality:    "textimage2text",
		Description: "Fast and efficient Gemini model with multimodal support",
	})
	models = append(models, gen.Model{
		ID:          "gemini-2.5-flash-lite",
		Name:        "Gemini 2.5 Flash Lite",
		Provider:    p.Name(),
		Modality:    "textimage2text",
		Description: "Lightweight Gemini model with multimodal support",
	})

	return models, nil
}

func (p *GeminiProvider) Generate(req gen.GenerateRequest) (*gen.GenerateResponse, error) {
	if req.APIKey == "" {
		return nil, fmt.Errorf("Gemini API key is required")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  req.APIKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create Gemini client: %w", err)
	}

	// For now, simple text generation
	// TODO: Add support for image inputs when req.Images is provided
	result, err := client.Models.GenerateContent(
		ctx,
		req.Model,
		genai.Text(req.Prompt),
		nil,
	)
	if err != nil {
		return nil, fmt.Errorf("Gemini generation failed: %w", err)
	}

	return &gen.GenerateResponse{
		Content: result.Text(),
		Model:   req.Model,
	}, nil
}