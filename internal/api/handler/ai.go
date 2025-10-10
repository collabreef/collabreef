package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/unsealdev/unseal/internal/ai/text2image"
	text2imageOpenAI "github.com/unsealdev/unseal/internal/ai/text2image/providers/openai"
	"github.com/unsealdev/unseal/internal/ai/text2text"
	text2textGemini "github.com/unsealdev/unseal/internal/ai/text2text/providers/gemini"
	text2textOpenAI "github.com/unsealdev/unseal/internal/ai/text2text/providers/openai"
	"github.com/unsealdev/unseal/internal/ai/textimage2image"
	textimage2imageOpenAI "github.com/unsealdev/unseal/internal/ai/textimage2image/providers/openai"
	"github.com/unsealdev/unseal/internal/ai/textimage2text"
	textimage2textGemini "github.com/unsealdev/unseal/internal/ai/textimage2text/providers/gemini"
	textimage2textOpenAI "github.com/unsealdev/unseal/internal/ai/textimage2text/providers/openai"
	"github.com/unsealdev/unseal/internal/ai/unified"
	"github.com/unsealdev/unseal/internal/config"
	"github.com/unsealdev/unseal/internal/model"
	"github.com/unsealdev/unseal/internal/util"
)

func (h *Handler) ListAIModels(c echo.Context) error {
	user := c.Get("user").(model.User)

	if user.ID == "" {
		return c.JSON(http.StatusUnauthorized, "")
	}

	userSettings, err := h.db.FindUserSettingsByID(user.ID)

	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	svc, err := createUnifiedAIService(userSettings)

	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	models, err := svc.ListModels()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, models)
}

func (h Handler) GenerateAI(c echo.Context) error {
	req := unified.AIGenerateRequest{}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	user := c.Get("user").(model.User)

	if user.ID == "" {
		return c.JSON(http.StatusUnauthorized, "")
	}

	userSettings, err := h.db.FindUserSettingsByID(user.ID)

	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	svc, err := createUnifiedAIService(userSettings)

	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	// Generate AI response
	res, err := svc.Generate(req)

	// Save generation record to database
	generation := createAIGenerationRecord(user.ID, req, res, err)
	if saveErr := h.db.CreateAIGeneration(generation); saveErr != nil {
		// Log error but don't fail the request
		// You might want to add proper logging here
	}

	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, res)
}

func createUnifiedAIService(u model.UserSettings) (*unified.Service, error) {
	secret := config.C.GetString(config.APP_SECRET)

	// Create text2text providers
	var text2textProviders []text2text.Provider
	if u.OpenAIKey != nil {
		apikey, err := util.Decrypt(*u.OpenAIKey, secret)
		if err != nil {
			return nil, err
		}
		if apikey != "" {
			text2textProviders = append(text2textProviders, text2textOpenAI.NewOpenAIText2Text(apikey))
		}
	}
	if u.GeminiKey != nil {
		apikey, err := util.Decrypt(*u.GeminiKey, secret)
		if err != nil {
			return nil, err
		}
		if apikey != "" {
			text2textProviders = append(text2textProviders, text2textGemini.NewGeminiText2Text(apikey))
		}
	}

	// Create text2image providers
	var text2imageProviders []text2image.Provider
	if u.OpenAIKey != nil {
		apikey, err := util.Decrypt(*u.OpenAIKey, secret)
		if err != nil {
			return nil, err
		}
		if apikey != "" {
			text2imageProviders = append(text2imageProviders, text2imageOpenAI.NewOpenAIText2Image(apikey))
		}
	}

	// Create textimage2text providers
	var textimage2textProviders []textimage2text.Provider
	if u.OpenAIKey != nil {
		apikey, err := util.Decrypt(*u.OpenAIKey, secret)
		if err != nil {
			return nil, err
		}
		if apikey != "" {
			textimage2textProviders = append(textimage2textProviders, textimage2textOpenAI.NewOpenAITextImage2Text(apikey))
		}
	}
	if u.GeminiKey != nil {
		apikey, err := util.Decrypt(*u.GeminiKey, secret)
		if err != nil {
			return nil, err
		}
		if apikey != "" {
			textimage2textProviders = append(textimage2textProviders, textimage2textGemini.NewGeminiTextImage2Text(apikey))
		}
	}

	// Create textimage2image providers
	var textimage2imageProviders []textimage2image.Provider
	if u.OpenAIKey != nil {
		apikey, err := util.Decrypt(*u.OpenAIKey, secret)
		if err != nil {
			return nil, err
		}
		if apikey != "" {
			textimage2imageProviders = append(textimage2imageProviders, textimage2imageOpenAI.NewOpenAITextImage2Image(apikey))
		}
	}

	return unified.NewService(
		text2text.NewService(text2textProviders...),
		text2image.NewService(text2imageProviders...),
		textimage2text.NewService(textimage2textProviders...),
		textimage2image.NewService(textimage2imageProviders...),
	), nil
}

func createAIGenerationRecord(userID string, req unified.AIGenerateRequest, res *unified.AIGenerateResponse, genErr error) model.AIGeneration {
	generation := model.AIGeneration{
		ID:            uuid.New().String(),
		UserID:        userID,
		Modality:      req.Modality,
		Provider:      req.Provider,
		Model:         req.Model,
		CreatedAt:     time.Now().Format(time.RFC3339),
		RequestPrompt: req.Prompt,
	}

	// Copy request fields
	generation.RequestSystemPrompt = req.SystemPrompt
	generation.RequestTemperature = req.Temperature
	generation.RequestMaxTokens = req.MaxTokens
	generation.RequestSize = req.Size
	generation.RequestQuality = req.Quality
	generation.RequestStyle = req.Style
	generation.RequestN = req.N

	// Handle image URLs (convert slice to JSON string)
	if len(req.ImageURLs) > 0 {
		if jsonBytes, err := json.Marshal(req.ImageURLs); err == nil {
			jsonStr := string(jsonBytes)
			generation.RequestImageURLs = &jsonStr
		}
	}

	generation.RequestMaskURL = req.MaskURL

	// Copy response fields
	if res != nil {
		generation.ResponseText = res.Text
		generation.ResponseImageURL = res.ImageURL
	}

	// Copy error if any
	if genErr != nil {
		errMsg := genErr.Error()
		generation.ErrorMessage = &errMsg
	}

	return generation
}