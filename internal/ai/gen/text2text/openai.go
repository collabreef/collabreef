package text2text

import (
	"context"
	"fmt"

	"github.com/openai/openai-go/v2"
	"github.com/openai/openai-go/v2/option"
	"github.com/unsealdev/unseal/internal/ai/gen"
)

// OpenAIText2TextProvider implements text-to-text generation using OpenAI's Chat Completions API
type OpenAIText2TextProvider struct{}

// NewOpenAIText2TextProvider creates a new OpenAI text-to-text provider
func NewOpenAIText2TextProvider() *OpenAIText2TextProvider {
	return &OpenAIText2TextProvider{}
}

func (p *OpenAIText2TextProvider) Name() string {
	return "openai"
}

func (p *OpenAIText2TextProvider) DisplayName() string {
	return "OpenAI"
}

func (p *OpenAIText2TextProvider) Modality() string {
	return "text2text"
}

func (p *OpenAIText2TextProvider) ListModels() ([]gen.Model, error) {
	var models []gen.Model

	models = append(models, gen.Model{
		ID:                  "gpt-4o",
		Name:                "GPT-4o",
		Provider:            "openai",
		ProviderDisplayName: p.DisplayName(),
		Modality:            "text2text",
		Description:         "Most capable GPT-4o model for text generation",
	})
	models = append(models, gen.Model{
		ID:                  "gpt-4o-mini",
		Name:                "GPT-4o Mini",
		Provider:            "openai",
		ProviderDisplayName: p.DisplayName(),
		Modality:            "text2text",
		Description:         "Faster and more affordable GPT-4o model",
	})
	models = append(models, gen.Model{
		ID:                  "gpt-4-turbo",
		Name:                "GPT-4 Turbo",
		Provider:            "openai",
		ProviderDisplayName: p.DisplayName(),
		Modality:            "text2text",
		Description:         "High-performance GPT-4 model",
	})
	models = append(models, gen.Model{
		ID:                  "gpt-3.5-turbo",
		Name:                "GPT-3.5 Turbo",
		Provider:            "openai",
		ProviderDisplayName: p.DisplayName(),
		Modality:            "text2text",
		Description:         "Fast and affordable GPT-3.5 model",
	})
	models = append(models, gen.Model{
		ID:                  "o1-preview",
		Name:                "O1 Preview",
		Provider:            "openai",
		ProviderDisplayName: p.DisplayName(),
		Modality:            "text2text",
		Description:         "Advanced reasoning model (preview)",
	})
	models = append(models, gen.Model{
		ID:                  "o1-mini",
		Name:                "O1 Mini",
		Provider:            "openai",
		ProviderDisplayName: p.DisplayName(),
		Modality:            "text2text",
		Description:         "Efficient reasoning model",
	})

	return models, nil
}

func (p *OpenAIText2TextProvider) Generate(req gen.GenerateRequest) (*gen.GenerateResponse, error) {
	if req.APIKey == "" {
		return nil, fmt.Errorf("OpenAI API key is required")
	}

	if req.Prompt == "" {
		return nil, fmt.Errorf("prompt is required")
	}

	// Create OpenAI client with API key
	client := openai.NewClient(
		option.WithAPIKey(req.APIKey),
	)

	// Build chat completion request
	params := openai.ChatCompletionNewParams{
		Model: openai.ChatModel(req.Model),
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.UserMessage(req.Prompt),
		},
	}

	// Add optional parameters
	if req.MaxTokens > 0 {
		params.MaxTokens = openai.Int(int64(req.MaxTokens))
	}

	if req.Temperature > 0 {
		params.Temperature = openai.Float(req.Temperature)
	}

	// Call Chat Completions API
	ctx := context.Background()
	chatCompletion, err := client.Chat.Completions.New(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("OpenAI chat completion failed: %w", err)
	}

	// Extract response
	if len(chatCompletion.Choices) == 0 {
		return nil, fmt.Errorf("no response from OpenAI")
	}

	content := chatCompletion.Choices[0].Message.Content
	finishReason := string(chatCompletion.Choices[0].FinishReason)

	return &gen.GenerateResponse{
		Content:      content,
		Model:        chatCompletion.Model,
		FinishReason: finishReason,
	}, nil
}