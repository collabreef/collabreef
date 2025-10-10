package openai

import (
	"context"

	"github.com/openai/openai-go/v2"
	"github.com/openai/openai-go/v2/option"
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
	client := openai.NewClient(
		option.WithAPIKey(o.apiKey),
	)

	params := openai.ImageGenerateParams{
		Model:  openai.F(openai.ImageModel(req.Model)),
		Prompt: openai.String(req.Prompt),
	}

	// Add optional parameters
	if req.Size != nil {
		params.Size = openai.F(openai.ImageGenerateParamsSize(*req.Size))
	}

	if req.Quality != nil {
		params.Quality = openai.F(openai.ImageGenerateParamsQuality(*req.Quality))
	}

	if req.Style != nil {
		params.Style = openai.F(openai.ImageGenerateParamsStyle(*req.Style))
	}

	if req.N != nil {
		params.N = openai.Int(*req.N)
	}

	resp, err := client.Images.Generate(context.Background(), params)
	if err != nil {
		return nil, err
	}

	if len(resp.Data) == 0 {
		return &text2image.GenerateResponse{ImageURL: ""}, nil
	}

	return &text2image.GenerateResponse{ImageURL: resp.Data[0].URL}, nil
}
