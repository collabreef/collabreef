package openai

import (
	"github.com/unsealdev/unseal/internal/ai/text2image"
)

type OpenAIText2Image struct {
	apiKey string
}

func NewOpenAIText2Image(apiKey string) OpenAIText2Image {
	return OpenAIText2Image{apiKey: apiKey}
}

func (o OpenAIText2Image) Name() string {
	return "openai"
}

func (o OpenAIText2Image) ListModels() ([]text2image.Model, error) {
	models := []text2image.Model{
		{ID: "dall-e-3", Name: "DALL-E 3", Provider: "openai"},
		{ID: "dall-e-2", Name: "DALL-E 2", Provider: "openai"},
	}

	return models, nil
}

func (o OpenAIText2Image) Generate(req text2image.GenerateRequest) (*text2image.GenerateResponse, error) {

	return &text2image.GenerateResponse{ImageURL: "text2image" + req.Model + req.Prompt}, nil
}
