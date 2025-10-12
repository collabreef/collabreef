package openai

import (
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

	return &textimage2text.GenerateResponse{Output: "textimage2text" + req.Model + req.Prompt}, nil
}
