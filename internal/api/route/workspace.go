package route

import (
	"strings"

	"github.com/pinbook/pinbook/internal/api/handler"
	"github.com/pinbook/pinbook/internal/api/middlewares"

	"github.com/labstack/echo/v4"
)

func RegisterWorkspace(api *echo.Group, h handler.Handler, authMiddleware middlewares.AuthMiddleware, workspaceMiddleware middlewares.WorkspaceMiddleware) {
	g := api.Group("/workspaces")
	g.Use(middlewares.Skippable(authMiddleware.CheckJWT(), func(c echo.Context) bool {
		// Skip JWT auth for routes intended to be publicly accessible
		return strings.HasSuffix(c.Path(), "/:workspaceId/files/:id")
	}))
	g.Use(authMiddleware.ParseJWT())
	g.Use(workspaceMiddleware.CheckWorkspaceExists())

	g.GET("", h.GetWorkspaces)
	g.GET("/:workspaceId", h.GetWorkspace)
	g.POST("", h.CreateWorkspace)
	g.PUT("/:workspaceId", h.UpdateWorkspace)
	g.DELETE("/:workspaceId", h.DeleteWorkspace)

	g.GET("/:workspaceId/notes", h.GetNotes)
	g.POST("/:workspaceId/notes", h.CreateNote)
	g.GET("/:workspaceId/notes/:id", h.GetNote)
	g.PUT("/:workspaceId/notes/:id", h.UpdateNote)
	g.DELETE("/:workspaceId/notes/:id", h.DeleteNote)
	g.PATCH("/:workspaceId/notes/:id/visibility/:visibility", h.UpdateNoteVisibility)

	g.GET("/:workspaceId/files/:id", h.Download)
	g.GET("/:workspaceId/files", h.List)
	g.POST("/:workspaceId/files", h.Upload)
	g.DELETE("/:workspaceId/files/:id", h.Delete)
}
