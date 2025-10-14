package route

import (
	"github.com/labstack/echo/v4"
	"github.com/unsealdev/unseal/internal/api/handler"
	"github.com/unsealdev/unseal/internal/api/middlewares"
)

func RegisterPublic(api *echo.Group, h handler.Handler, a middlewares.AuthMiddleware) {
	g := api.Group("/public")
	g.Use(a.ParseJWT())

	g.GET("/notes", h.GetPublicNotes)
	g.GET("/notes/:id", h.GetPublicNote)
}
