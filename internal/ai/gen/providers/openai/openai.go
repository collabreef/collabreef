package openai

import (
	"context"
	"fmt"

	"github.com/openai/openai-go/v2"
	"github.com/openai/openai-go/v2/option"
	"github.com/openai/openai-go/v2/responses"
	"github.com/unsealdev/unseal/internal/ai/gen"
)

type OpenAIProvider struct{}

func NewOpenAIProvider() *OpenAIProvider {
	return &OpenAIProvider{}
}

func (p *OpenAIProvider) Name() string {
	return "openai"
}

func (p *OpenAIProvider) Modality() string {
	// OpenAI supports text-to-text and text+image-to-text (vision)
	return "text2text,textimage2text"
}

func (p *OpenAIProvider) ListModels() ([]gen.Model, error) {
	// Return static list of common OpenAI models
	// Dynamic listing requires API key, which should not be stored in provider
	var models []gen.Model

	models = append(models, gen.Model{
		ID:          "gpt-4o",
		Name:        "GPT-4o",
		Provider:    "openai",
		Modality:    "textimage2text",
		Description: "Most capable GPT-4o model with vision support",
	})
	models = append(models, gen.Model{
		ID:          "gpt-4o-mini",
		Name:        "GPT-4o Mini",
		Provider:    "openai",
		Modality:    "textimage2text",
		Description: "Faster and more affordable GPT-4o with vision support",
	})
	models = append(models, gen.Model{
		ID:          "gpt-4-turbo",
		Name:        "GPT-4 Turbo",
		Provider:    "openai",
		Modality:    "textimage2text",
		Description: "GPT-4 Turbo with vision support",
	})
	models = append(models, gen.Model{
		ID:          "gpt-3.5-turbo",
		Name:        "GPT-3.5 Turbo",
		Provider:    "openai",
		Modality:    "text2text",
		Description: "Fast and affordable GPT-3.5",
	})

	return models, nil
}

func (p *OpenAIProvider) Generate(req gen.GenerateRequest) (*gen.GenerateResponse, error) {
	if req.APIKey == "" {
		return nil, fmt.Errorf("OpenAI API key is required")
	}

	client := openai.NewClient(
		option.WithAPIKey(req.APIKey),
	)

	// For now, use the responses API for simple text generation
	// TODO: Support vision API for image inputs when req.Images is provided
	resp, err := client.Responses.New(context.Background(), responses.ResponseNewParams{
		Model: req.Model,
		Input: responses.ResponseNewParamsInputUnion{
			OfString: openai.String(req.Prompt),
		},
	})

	if err != nil {
		return nil, fmt.Errorf("OpenAI generation failed: %w", err)
	}

	return &gen.GenerateResponse{
		Content: resp.OutputText(),
		Model:   req.Model,
	}, nil
}
