package text2text

import (
	"context"
	"fmt"

	"github.com/unsealdev/unseal/internal/ai/gen"
	"google.golang.org/genai"
)

// GeminiText2TextProvider implements text-to-text generation using Google's Gemini API
type GeminiText2TextProvider struct{}

// NewGeminiText2TextProvider creates a new Gemini text-to-text provider
func NewGeminiText2TextProvider() *GeminiText2TextProvider {
	return &GeminiText2TextProvider{}
}

func (p *GeminiText2TextProvider) Name() string {
	return "gemini"
}

func (p *GeminiText2TextProvider) DisplayName() string {
	return "Google Gemini"
}

func (p *GeminiText2TextProvider) Modality() string {
	return "text2text"
}

func (p *GeminiText2TextProvider) ListModels() ([]gen.Model, error) {
	var models []gen.Model

	models = append(models, gen.Model{
		ID:                  "gemini-2.5-pro",
		Name:                "Gemini 2.5 Pro",
		Provider:            "gemini",
		ProviderDisplayName: p.DisplayName(),
		Modality:            "text2text",
		Description:         "Most capable Gemini model for text generation",
	})
	models = append(models, gen.Model{
		ID:                  "gemini-2.5-flash",
		Name:                "Gemini 2.5 Flash",
		Provider:            "gemini",
		ProviderDisplayName: p.DisplayName(),
		Modality:            "text2text",
		Description:         "Fast and efficient Gemini model",
	})
	models = append(models, gen.Model{
		ID:                  "gemini-2.5-flash-lite",
		Name:                "Gemini 2.5 Flash Lite",
		Provider:            "gemini",
		ProviderDisplayName: p.DisplayName(),
		Modality:            "text2text",
		Description:         "Lightweight Gemini model",
	})

	return models, nil
}

func (p *GeminiText2TextProvider) Generate(req gen.GenerateRequest) (*gen.GenerateResponse, error) {
	if req.APIKey == "" {
		return nil, fmt.Errorf("Gemini API key is required")
	}

	if req.Prompt == "" {
		return nil, fmt.Errorf("prompt is required")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  req.APIKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create Gemini client: %w", err)
	}

	// Build generation config
	var genConfig *genai.GenerateContentConfig
	if req.MaxTokens > 0 || req.Temperature > 0 {
		genConfig = &genai.GenerateContentConfig{}
		if req.MaxTokens > 0 {
			genConfig.MaxOutputTokens = int32(req.MaxTokens)
		}
		if req.Temperature > 0 {
			temp := float32(req.Temperature)
			genConfig.Temperature = &temp
		}
	}

	// Call Gemini API for text generation
	result, err := client.Models.GenerateContent(
		ctx,
		req.Model,
		genai.Text(req.Prompt),
		genConfig,
	)
	if err != nil {
		return nil, fmt.Errorf("Gemini generation failed: %w", err)
	}

	// Extract response
	content := result.Text()
	finishReason := ""
	if len(result.Candidates) > 0 {
		finishReason = string(result.Candidates[0].FinishReason)
	}

	return &gen.GenerateResponse{
		Content:      content,
		Model:        req.Model,
		FinishReason: finishReason,
	}, nil
}