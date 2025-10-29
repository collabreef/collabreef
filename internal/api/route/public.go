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
	g.GET("/notes/:noteId/view-objects", h.GetPublicViewObjectsForNote)
	g.GET("/views", h.GetPublicViews)
	g.GET("/views/:id", h.GetPublicView)
	g.GET("/views/:viewId/objects", h.GetPublicViewObjects)
}
