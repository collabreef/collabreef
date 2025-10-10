package route

import (
	"github.com/unsealdev/unseal/internal/api/handler"
	"github.com/unsealdev/unseal/internal/api/middlewares"

	"github.com/labstack/echo/v4"
)

func RegisterTool(api *echo.Group, h handler.Handler, authMiddleware middlewares.AuthMiddleware) {
	g := api.Group("/tools")
	g.Use(authMiddleware.CheckJWT())
	g.Use(authMiddleware.ParseJWT())

	g.POST("/fetchfile", h.FetchFile)

	// Unified AI endpoints
	aiGroup := g.Group("/ai")
	aiGroup.GET("/models", h.ListAIModels)
	aiGroup.POST("/generate", h.GenerateAI)

	// Legacy endpoints (kept for backwards compatibility)
	textgenGroup := g.Group("/textgen")
	textgenGroup.GET("/models", h.ListTextModels)
	textgenGroup.POST("/generate", h.GenerateText)
}
