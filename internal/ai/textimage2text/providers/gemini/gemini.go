package gemini

import (
	"github.com/unsealdev/unseal/internal/ai/textimage2text"
)

type GeminiTextImage2Text struct {
	apiKey string
}

func NewGeminiTextImage2Text(apiKey string) GeminiTextImage2Text {
	return GeminiTextImage2Text{apiKey: apiKey}
}

func (g GeminiTextImage2Text) Name() string {
	return "gemini"
}

func (g GeminiTextImage2Text) ListModels() ([]textimage2text.Model, error) {
	models := []textimage2text.Model{
		{ID: "gemini-2.0-flash-exp", Name: "Gemini 2.0 Flash (Experimental)", Provider: g.Name()},
		{ID: "gemini-exp-1206", Name: "Gemini Exp 1206", Provider: g.Name()},
		{ID: "gemini-1.5-pro", Name: "Gemini 1.5 Pro", Provider: g.Name()},
		{ID: "gemini-1.5-flash", Name: "Gemini 1.5 Flash", Provider: g.Name()},
	}

	return models, nil
}

func (g GeminiTextImage2Text) Generate(req textimage2text.GenerateRequest) (*textimage2text.GenerateResponse, error) {

	return &textimage2text.GenerateResponse{Output: "textimage2text" + req.Model + req.Prompt}, nil
}
