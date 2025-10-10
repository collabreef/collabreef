package gemini

import (
	"context"
	"encoding/base64"
	"io"
	"net/http"

	"github.com/unsealdev/unseal/internal/ai/textimage2text"
	"google.golang.org/genai"
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
	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  g.apiKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		return nil, err
	}

	var config *genai.GenerateContentConfig

	// Add system instruction if provided
	if req.SystemPrompt != nil && *req.SystemPrompt != "" {
		config = &genai.GenerateContentConfig{
			SystemInstruction: genai.Text(*req.SystemPrompt),
		}
	}

	// Add temperature if provided
	if config == nil {
		config = &genai.GenerateContentConfig{}
	}
	if req.Temperature != nil {
		config.Temperature = req.Temperature
	}
	if req.MaxTokens != nil {
		maxOutputTokens := int32(*req.MaxTokens)
		config.MaxOutputTokens = &maxOutputTokens
	}

	// Build content parts
	var parts []genai.Part

	// Add text part
	parts = append(parts, genai.Text(req.Prompt))

	// Add images from URLs
	for _, imgURL := range req.ImageURLs {
		// Download image
		resp, err := http.Get(imgURL)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		imgData, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}

		parts = append(parts, genai.Blob{
			MIMEType: resp.Header.Get("Content-Type"),
			Data:     imgData,
		})
	}

	// Add images from base64
	for _, imgBase64 := range req.ImageBase64s {
		imgData, err := base64.StdEncoding.DecodeString(imgBase64)
		if err != nil {
			return nil, err
		}

		parts = append(parts, genai.Blob{
			MIMEType: "image/jpeg", // Default to JPEG, could be improved to detect type
			Data:     imgData,
		})
	}

	contents := []*genai.Content{
		{
			Parts: parts,
			Role:  "user",
		},
	}

	result, err := client.Models.GenerateContent(
		ctx,
		req.Model,
		contents,
		config,
	)
	if err != nil {
		return nil, err
	}

	return &textimage2text.GenerateResponse{Output: result.Text()}, nil
}
