package openai

import (
	"github.com/unsealdev/unseal/internal/ai/textimage2image"
)

type OpenAITextImage2Image struct {
	apiKey string
}

func NewOpenAITextImage2Image(apiKey string) OpenAITextImage2Image {
	return OpenAITextImage2Image{apiKey: apiKey}
}

func (o OpenAITextImage2Image) Name() string {
	return "openai"
}

func (o OpenAITextImage2Image) ListModels() ([]textimage2image.Model, error) {
	models := []textimage2image.Model{
		{ID: "dall-e-2", Name: "DALL-E 2 (Edit/Variation)", Provider: "openai"},
	}

	return models, nil
}

func (o OpenAITextImage2Image) Generate(req textimage2image.GenerateRequest) (*textimage2image.GenerateResponse, error) {

	return &textimage2image.GenerateResponse{ImageURL: "textimage2image" + req.Model + req.Prompt}, nil
}
