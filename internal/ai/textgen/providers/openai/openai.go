package openai

import (
	"context"
	"strings"

	"github.com/openai/openai-go/v2"
	"github.com/openai/openai-go/v2/option"
	"github.com/openai/openai-go/v2/responses"
	"github.com/pinbook/pinbook/internal/ai/textgen"
)

type OpenaiTextGen struct {
	apiKey string
}

func NewOpenaiTextGen(apiKey string) OpenaiTextGen {
	return OpenaiTextGen{apiKey: apiKey}
}

func (o OpenaiTextGen) Name() string {
	return "openai"
}

func (o OpenaiTextGen) ListModels() ([]textgen.Model, error) {
	client := openai.NewClient(
		option.WithAPIKey(o.apiKey),
	)

	res, err := client.Models.List(context.Background())

	if err != nil {
		return nil, err
	}

	var models []textgen.Model

	for _, d := range res.Data {
		if strings.Contains(d.ID, "gpt") {
			models = append(models, textgen.Model{ID: d.ID, Name: d.ID, Provider: "openai"})
		}
	}

	return models, nil
}

func (o OpenaiTextGen) Generate(req textgen.GenerateRequest) (*textgen.GenerateResponse, error) {
	client := openai.NewClient(
		option.WithAPIKey(o.apiKey),
	)

	resp, err := client.Responses.New(context.Background(), responses.ResponseNewParams{
		Model: req.Model,
		Input: responses.ResponseNewParamsInputUnion{
			OfString: openai.String(req.Prompt),
		},
	})

	if err != nil {
		return nil, err
	}

	return &textgen.GenerateResponse{Text: resp.OutputText()}, nil
}
