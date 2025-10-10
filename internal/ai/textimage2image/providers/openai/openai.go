package openai

import (
	"context"
	"encoding/base64"
	"io"
	"net/http"

	"github.com/openai/openai-go/v2"
	"github.com/openai/openai-go/v2/option"
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
	client := openai.NewClient(
		option.WithAPIKey(o.apiKey),
	)

	var imageData []byte
	var err error

	// Get image data from URL or base64
	if req.ImageURL != nil {
		resp, err := http.Get(*req.ImageURL)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		imageData, err = io.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}
	} else if req.ImageBase64 != nil {
		imageData, err = base64.StdEncoding.DecodeString(*req.ImageBase64)
		if err != nil {
			return nil, err
		}
	}

	// Check if we have a mask (inpainting) or just image variation/edit
	if req.MaskURL != nil || req.MaskBase64 != nil {
		// Inpainting (edit with mask)
		var maskData []byte

		if req.MaskURL != nil {
			resp, err := http.Get(*req.MaskURL)
			if err != nil {
				return nil, err
			}
			defer resp.Body.Close()

			maskData, err = io.ReadAll(resp.Body)
			if err != nil {
				return nil, err
			}
		} else if req.MaskBase64 != nil {
			maskData, err = base64.StdEncoding.DecodeString(*req.MaskBase64)
			if err != nil {
				return nil, err
			}
		}

		params := openai.ImageEditParams{
			Image:  openai.FileParam(imageData, "image.png", "image/png"),
			Mask:   openai.F(openai.FileParam(maskData, "mask.png", "image/png")),
			Prompt: openai.String(req.Prompt),
		}

		if req.N != nil {
			params.N = openai.Int(*req.N)
		}

		if req.Size != nil {
			params.Size = openai.F(openai.ImageEditParamsSize(*req.Size))
		}

		resp, err := client.Images.Edit(context.Background(), params)
		if err != nil {
			return nil, err
		}

		if len(resp.Data) == 0 {
			return &textimage2image.GenerateResponse{ImageURL: ""}, nil
		}

		return &textimage2image.GenerateResponse{ImageURL: resp.Data[0].URL}, nil
	}

	// Image variation (no prompt needed, but we support it)
	params := openai.ImageVariationParams{
		Image: openai.FileParam(imageData, "image.png", "image/png"),
	}

	if req.N != nil {
		params.N = openai.Int(*req.N)
	}

	if req.Size != nil {
		params.Size = openai.F(openai.ImageVariationParamsSize(*req.Size))
	}

	resp, err := client.Images.Variation(context.Background(), params)
	if err != nil {
		return nil, err
	}

	if len(resp.Data) == 0 {
		return &textimage2image.GenerateResponse{ImageURL: ""}, nil
	}

	return &textimage2image.GenerateResponse{ImageURL: resp.Data[0].URL}, nil
}