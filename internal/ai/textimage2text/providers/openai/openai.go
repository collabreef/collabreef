package openai

import (
	"context"

	"github.com/openai/openai-go/v2"
	"github.com/openai/openai-go/v2/option"
	"github.com/unsealdev/unseal/internal/ai/textimage2text"
)

type OpenAITextImage2Text struct {
	apiKey string
}

func NewOpenAITextImage2Text(apiKey string) OpenAITextImage2Text {
	return OpenAITextImage2Text{apiKey: apiKey}
}

func (o OpenAITextImage2Text) Name() string {
	return "openai"
}

func (o OpenAITextImage2Text) ListModels() ([]textimage2text.Model, error) {
	models := []textimage2text.Model{
		{ID: "gpt-4o", Name: "GPT-4o", Provider: "openai"},
		{ID: "gpt-4o-mini", Name: "GPT-4o Mini", Provider: "openai"},
		{ID: "gpt-4-turbo", Name: "GPT-4 Turbo", Provider: "openai"},
	}

	return models, nil
}

func (o OpenAITextImage2Text) Generate(req textimage2text.GenerateRequest) (*textimage2text.GenerateResponse, error) {
	client := openai.NewClient(
		option.WithAPIKey(o.apiKey),
	)

	messages := []openai.ChatCompletionMessageParamUnion{}

	// Add system message if provided
	if req.SystemPrompt != nil && *req.SystemPrompt != "" {
		messages = append(messages, openai.SystemMessage(*req.SystemPrompt))
	}

	// Build user message with text and images
	var contentParts []openai.ChatCompletionContentPartUnionParam

	// Add text part
	contentParts = append(contentParts, openai.TextPart(req.Prompt))

	// Add image URLs
	for _, imgURL := range req.ImageURLs {
		contentParts = append(contentParts, openai.ImagePart(imgURL))
	}

	// Add base64 images
	for _, imgBase64 := range req.ImageBase64s {
		contentParts = append(contentParts, openai.ImagePart(imgBase64))
	}

	messages = append(messages, openai.UserMessageParts(contentParts...))

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
		return &textimage2text.GenerateResponse{Output: ""}, nil
	}

	return &textimage2text.GenerateResponse{Output: resp.Choices[0].Message.Content}, nil
}
