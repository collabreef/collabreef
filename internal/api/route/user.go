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
}
