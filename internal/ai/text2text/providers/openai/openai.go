package openai

import (
	"context"

	"github.com/openai/openai-go/v2"
	"github.com/openai/openai-go/v2/option"
	"github.com/unsealdev/unseal/internal/ai/text2text"
)

type OpenAIText2Text struct {
	apiKey string
}

func NewOpenAIText2Text(apiKey string) OpenAIText2Text {
	return OpenAIText2Text{apiKey: apiKey}
}

func (o OpenAIText2Text) Name() string {
	return "openai"
}

func (o OpenAIText2Text) ListModels() ([]text2text.Model, error) {
	// Return a curated list of chat models
	models := []text2text.Model{
		{ID: "gpt-4o", Name: "GPT-4o", Provider: "openai"},
		{ID: "gpt-4o-mini", Name: "GPT-4o Mini", Provider: "openai"},
		{ID: "gpt-4-turbo", Name: "GPT-4 Turbo", Provider: "openai"},
		{ID: "gpt-4", Name: "GPT-4", Provider: "openai"},
		{ID: "gpt-3.5-turbo", Name: "GPT-3.5 Turbo", Provider: "openai"},
	}

	return models, nil
}

func (o OpenAIText2Text) Generate(req text2text.GenerateRequest) (*text2text.GenerateResponse, error) {
	client := openai.NewClient(
		option.WithAPIKey(o.apiKey),
	)

	messages := []openai.ChatCompletionMessageParamUnion{}

	// Add system message if provided
	if req.SystemPrompt != nil && *req.SystemPrompt != "" {
		messages = append(messages, openai.SystemMessage(*req.SystemPrompt))
	}

	// Add user message
	messages = append(messages, openai.UserMessage(req.Prompt))

	params := openai.ChatCompletionNewParams{
		Model:    openai.F(req.Model),
		Messages: openai.F(messages),
	}

	// Add optional parameters
	if req.Temperature != nil {
		params.Temperature = openai.Float(*req.Temperature)
	}

	if req.MaxTokens != nil {
		params.MaxTokens = openai.Int(*req.MaxTokens)
	}

	resp, err := client.Chat.Completions.New(context.Background(), params)
	if err != nil {
		return nil, err
	}

	if len(resp.Choices) == 0 {
		return &text2text.GenerateResponse{Output: ""}, nil
	}

	return &text2text.GenerateResponse{Output: resp.Choices[0].Message.Content}, nil
}