package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/pinbook/pinbook/internal/api/auth"
	"golang.org/x/crypto/bcrypt"
)

type ChangePasswordRequest struct {
	Password string
}

type UpdatePreferencesRequest struct {
	Preferences json.RawMessage `json:"preferences" validate:"required"`
}

type SaveUserSettingsRequest struct {
	OpenAIKey *string `json:"openai_key"`
	GeminiKey *string `json:"gemini_key"`
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

	us.GeminiKey = maskAPIKey(us.GeminiKey)
	us.OpenAIKey = maskAPIKey(us.OpenAIKey)

	return c.JSON(http.StatusOK, us)
}

func (h Handler) UpdateUserSettings(c echo.Context) error {
	id := c.Param("id")

	cookie, err := c.Cookie("token")
	if err != nil || cookie.Value == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "missing or invalid token")
	}

	var req SaveUserSettingsRequest
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

	if req.OpenAIKey != nil {
		us.OpenAIKey = req.OpenAIKey
	}

	if req.GeminiKey != nil {
		us.GeminiKey = req.GeminiKey
	}

	err = h.db.SaveUserSettings(us)

	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to update settings")
	}

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

	masked := k[:3] + "***"
	return &masked
}
