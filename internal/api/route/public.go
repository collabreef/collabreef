package route

import (
	"github.com/labstack/echo/v4"
	"github.com/collabreef/collabreef/internal/api/handler"
	"github.com/collabreef/collabreef/internal/api/middlewares"
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
	g.GET("/views/:viewId/objects/:id", h.GetPublicViewObject)
	g.GET("/views/:viewId/objects/:id/notes", h.GetPublicNotesForViewObject)
}
