package route

import (
	"github.com/unsealdev/unseal/internal/api/handler"
	"github.com/unsealdev/unseal/internal/api/middlewares"

	"github.com/labstack/echo/v4"
)

func RegisterUser(api *echo.Group, h handler.Handler, authMiddleware middlewares.AuthMiddleware) {
	g := api.Group("/users")
	g.Use(authMiddleware.CheckJWT())
	g.Use(authMiddleware.ParseJWT())
	g.PATCH("/:id/preferences", h.UpdatePreferences)

	g.GET("/:id/settings", h.GetUserSettings)
	g.PATCH("/:id/settings/openaikey", h.UpdateOpenAIKey)
	g.PATCH("/:id/settings/geminikey", h.UpdateGeminiKey)

	g.GET("/:userid/gencommands", h.GetUserGenCommands)
	g.POST("/:userid/gencommands", h.CreateUserGenCommand)
	g.PUT("/:userid/gencommands/:id", h.UpdateUserGenCommand)
	g.DELETE("/:userid/gencommands/:id", h.DeleteUserGenCommand)
}
