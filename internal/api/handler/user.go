package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/unsealdev/unseal/internal/api/auth"
	"github.com/unsealdev/unseal/internal/config"
	"github.com/unsealdev/unseal/internal/util"
	"golang.org/x/crypto/bcrypt"
)

type ChangePasswordRequest struct {
	Password string
}

type UpdatePreferencesRequest struct {
	Preferences json.RawMessage `json:"preferences" validate:"required"`
}

type SaveOpenaiKeyRequest struct {
	OpenAIKey *string `json:"openai_api_key"`
}

type SaveGeminiKeyRequest struct {
	GeminiKey *string `json:"gemini_api_key"`
}

type SaveOllamaKeyRequest struct {
	OllamaKey *string `json:"ollama_api_key"`
}

func (h Handler) UpdatePreferences(c echo.Context) error {
	id := c.Param("id")
	cookie, err := c.Cookie("token")
	if err != nil || cookie.Value == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "missing or invalid token")
	}

	user, err := auth.GetUserFromCookie(cookie)
	if err != nil || user == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
	}

	if user.ID != id {
		return echo.NewHTTPError(http.StatusForbidden, "You do not have permission to update the preferences.")
	}

	var req UpdatePreferencesRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	u, err := h.db.FindUserByID(id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to get user by id")
	}

	u.Preferences = string(req.Preferences)
	u.UpdatedAt = time.Now().UTC().String()
	u.UpdatedBy = user.ID

	err = h.db.UpdateUser(u)

	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to update user")
	}

	return c.JSON(http.StatusOK, "Successfully updated preferences.")
}

func (h Handler) ChangePassword(c echo.Context) error {
	id := c.Param("id")

	var req ChangePasswordRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if req.Password == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "password is required")
	}

	cookie, err := c.Cookie("token")
	if err != nil || cookie.Value == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "missing or invalid token")
	}

	user, err := auth.GetUserFromCookie(cookie)
	if err != nil || user == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
	}

	if user.ID != id {
		return echo.NewHTTPError(http.StatusForbidden, "You do not have permission to update the preferences.")
	}

	u, err := h.db.FindUserByID(id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to get user by id")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)

	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to hash password")
	}

	u.PasswordHash = string(hashedPassword)
	u.UpdatedAt = time.Now().UTC().String()
	u.UpdatedBy = user.ID

	err = h.db.UpdateUser(u)

	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to update user")
	}

	return c.JSON(http.StatusOK, "Successfully changed password.")
}

func (h Handler) GetUserSettings(c echo.Context) error {
	id := c.Param("id")

	cookie, err := c.Cookie("token")
	if err != nil || cookie.Value == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "missing or invalid token")
	}

	user, err := auth.GetUserFromCookie(cookie)
	if err != nil || user == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
	}

	if user.ID != id {
		return echo.NewHTTPError(http.StatusForbidden, "You do not have permission to get user settings")
	}

	us, err := h.db.FindUserSettingsByID(id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to get user settings by id")
	}

	secret := config.C.GetString(config.APP_SECRET)

	if us.OpenAIKey != nil {
		decrypted, err := util.Decrypt(*us.OpenAIKey, secret)

		if err != nil {
			return c.JSON(http.StatusInternalServerError, "failed to decrypt key")
		}

		us.OpenAIKey = maskAPIKey(&decrypted)
	}

	if us.GeminiKey != nil {
		decrypted, err := util.Decrypt(*us.GeminiKey, secret)

		if err != nil {
			return c.JSON(http.StatusInternalServerError, "failed to decrypt key")
		}

		us.GeminiKey = maskAPIKey(&decrypted)
	}

	if us.OllamaKey != nil {
		decrypted, err := util.Decrypt(*us.OllamaKey, secret)

		if err != nil {
			return c.JSON(http.StatusInternalServerError, "failed to decrypt key")
		}

		us.OllamaKey = maskAPIKey(&decrypted)
	}

	return c.JSON(http.StatusOK, us)
}

func (h Handler) UpdateOpenAIKey(c echo.Context) error {
	id := c.Param("id")

	cookie, err := c.Cookie("token")
	if err != nil || cookie.Value == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "missing or invalid token")
	}

	var req SaveOpenaiKeyRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	user, err := auth.GetUserFromCookie(cookie)
	if err != nil || user == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
	}

	if user.ID != id {
		return echo.NewHTTPError(http.StatusForbidden, "You do not have permission to update user settings")
	}

	us, err := h.db.FindUserSettingsByID(id)

	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to get user settings by id")
	}

	secret := config.C.GetString(config.APP_SECRET)

	if req.OpenAIKey != nil {
		encrypted, err := util.Encrypt(*req.OpenAIKey, secret)

		if err != nil {
			return c.JSON(http.StatusInternalServerError, "failed to encrypt api key")
		}

		us.OpenAIKey = &encrypted
	}
	err = h.db.SaveUserSettings(us)

	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to update settings")
	}

	us.OpenAIKey = maskAPIKey(req.OpenAIKey)

	return c.JSON(http.StatusOK, us)
}

func (h Handler) UpdateGeminiKey(c echo.Context) error {
	id := c.Param("id")

	cookie, err := c.Cookie("token")
	if err != nil || cookie.Value == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "missing or invalid token")
	}

	var req SaveGeminiKeyRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	user, err := auth.GetUserFromCookie(cookie)
	if err != nil || user == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
	}

	if user.ID != id {
		return echo.NewHTTPError(http.StatusForbidden, "You do not have permission to update user settings")
	}

	us, err := h.db.FindUserSettingsByID(id)

	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to get user settings by id")
	}

	secret := config.C.GetString(config.APP_SECRET)

	if req.GeminiKey != nil {
		encrypted, err := util.Encrypt(*req.GeminiKey, secret)

		if err != nil {
			return c.JSON(http.StatusInternalServerError, "failed to encrypt api key")
		}

		us.GeminiKey = &encrypted
	}
	err = h.db.SaveUserSettings(us)

	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to update settings")
	}

	us.GeminiKey = maskAPIKey(req.GeminiKey)

	return c.JSON(http.StatusOK, us)
}

func (h Handler) UpdateOllamaKey(c echo.Context) error {
	id := c.Param("id")

	cookie, err := c.Cookie("token")
	if err != nil || cookie.Value == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "missing or invalid token")
	}

	var req SaveOllamaKeyRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	user, err := auth.GetUserFromCookie(cookie)
	if err != nil || user == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
	}

	if user.ID != id {
		return echo.NewHTTPError(http.StatusForbidden, "You do not have permission to update user settings")
	}

	us, err := h.db.FindUserSettingsByID(id)

	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to get user settings by id")
	}

	secret := config.C.GetString(config.APP_SECRET)

	if req.OllamaKey != nil {
		encrypted, err := util.Encrypt(*req.OllamaKey, secret)

		if err != nil {
			return c.JSON(http.StatusInternalServerError, "failed to encrypt api key")
		}

		us.OllamaKey = &encrypted
	}
	err = h.db.SaveUserSettings(us)

	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to update settings")
	}

	us.OllamaKey = maskAPIKey(req.OllamaKey)

	return c.JSON(http.StatusOK, us)
}

func maskAPIKey(key *string) *string {
	if key == nil {
		return nil
	}

	k := *key
	if len(k) <= 3 {
		return &k
	}

	masked := k[:3] + "******************************************"
	return &masked
}
