package route

import (
	"github.com/pinbook/pinbook/internal/api/handler"
	"github.com/pinbook/pinbook/internal/api/middlewares"

	"github.com/labstack/echo/v4"
)

func RegisterWorkspace(api *echo.Group, h handler.Handler, authMiddleware middlewares.AuthMiddleware, workspaceMiddleware middlewares.WorkspaceMiddleware) {
	g := api.Group("/workspaces")
	g.Use(authMiddleware.JWT())
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

	g.GET("/:workspaceId/files/:id", h.Download)
	g.GET("/:workspaceId/files", h.List)
	g.POST("/:workspaceId/files", h.Upload)
	g.DELETE("/:workspaceId/files/:id", h.Delete)

	g.POST("/:workspaceId/tools/fetchfile", h.FetchFile)
}
