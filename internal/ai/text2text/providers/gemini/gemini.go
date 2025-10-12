package gemini

import (
	"github.com/unsealdev/unseal/internal/ai/text2text"
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

	return &text2text.GenerateResponse{Output: "text2text" + req.Model + req.Prompt}, nil
}
