package gemini

import (
	"context"

	"github.com/unsealdev/unseal/internal/ai/text2text"
	"google.golang.org/genai"
)

type GeminiText2Text struct {
	apiKey string
}

func NewGeminiText2Text(apiKey string) GeminiText2Text {
	return GeminiText2Text{apiKey: apiKey}
}

func (g GeminiText2Text) Name() string {
	return "gemini"
}

func (g GeminiText2Text) ListModels() ([]text2text.Model, error) {
	models := []text2text.Model{
		{ID: "gemini-2.0-flash-exp", Name: "Gemini 2.0 Flash (Experimental)", Provider: g.Name()},
		{ID: "gemini-exp-1206", Name: "Gemini Exp 1206", Provider: g.Name()},
		{ID: "gemini-2.0-flash-thinking-exp-01-21", Name: "Gemini 2.0 Flash Thinking", Provider: g.Name()},
		{ID: "gemini-1.5-pro", Name: "Gemini 1.5 Pro", Provider: g.Name()},
		{ID: "gemini-1.5-flash", Name: "Gemini 1.5 Flash", Provider: g.Name()},
	}

	return models, nil
}

func (g GeminiText2Text) Generate(req text2text.GenerateRequest) (*text2text.GenerateResponse, error) {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  g.apiKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		return nil, err
	}

	var contents []*genai.Content

	// Add system instruction if provided
	var config *genai.GenerateContentConfig
	if req.SystemPrompt != nil && *req.SystemPrompt != "" {
		config = &genai.GenerateContentConfig{
			SystemInstruction: genai.Text(*req.SystemPrompt),
		}
	}

	// Add temperature if provided
	if config == nil {
		config = &genai.GenerateContentConfig{}
	}
	if req.Temperature != nil {
		config.Temperature = req.Temperature
	}
	if req.MaxTokens != nil {
		maxOutputTokens := int32(*req.MaxTokens)
		config.MaxOutputTokens = &maxOutputTokens
	}

	// Add user message
	contents = append(contents, &genai.Content{
		Parts: []genai.Part{genai.Text(req.Prompt)},
		Role:  "user",
	})

	result, err := client.Models.GenerateContent(
		ctx,
		req.Model,
		contents,
		config,
	)
	if err != nil {
		return nil, err
	}

	return &text2text.GenerateResponse{Output: result.Text()}, nil
}