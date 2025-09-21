package openai

import (
	"context"

	"github.com/pinbook/pinbook/internal/ai/textgen"
	"google.golang.org/genai"
)

type GeminiTextGen struct {
	apiKey string
}

func NewGeminiTextGen(apiKey string) GeminiTextGen {
	return GeminiTextGen{apiKey: apiKey}
}

func (g GeminiTextGen) Name() string {
	return "openai"
}

func (g GeminiTextGen) ListModels() ([]textgen.Model, error) {
	client, err := genai.NewClient(context.Background(), &genai.ClientConfig{
		APIKey:  g.apiKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		return nil, err
	}
	res, err := client.Models.List(context.Background(), &genai.ListModelsConfig{})
	if err != nil {
		return nil, err
	}
	var models []textgen.Model

	for _, m := range res.Items {
		for _, action := range m.SupportedActions {
			if action == "generateContent" {
				models = append(models, textgen.Model{ID: m.DisplayName, Name: m.DisplayName, Provider: "gemini"})
			}
		}
	}

	return models, nil
}

func (g GeminiTextGen) Generate(req textgen.GenerateRequest) (*textgen.GenerateResponse, error) {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  g.apiKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		return nil, err
	}

	result, _ := client.Models.GenerateContent(
		ctx,
		req.Model,
		genai.Text(req.Prompt),
		nil,
	)

	return &textgen.GenerateResponse{Text: result.Text()}, nil
}
