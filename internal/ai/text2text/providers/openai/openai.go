package openai

import (
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
		{ID: "gpt-5", Name: "GPT-5", Provider: "openai"},
		{ID: "gpt-4o", Name: "GPT-4o", Provider: "openai"},
		{ID: "gpt-4o-mini", Name: "GPT-4o Mini", Provider: "openai"},
		{ID: "gpt-4-turbo", Name: "GPT-4 Turbo", Provider: "openai"},
		{ID: "gpt-4", Name: "GPT-4", Provider: "openai"},
		{ID: "gpt-3.5-turbo", Name: "GPT-3.5 Turbo", Provider: "openai"},
	}

	return models, nil
}

func (o OpenAIText2Text) Generate(req text2text.GenerateRequest) (*text2text.GenerateResponse, error) {

	return &text2text.GenerateResponse{Output: "text2text" + req.Model + req.Prompt}, nil
}
