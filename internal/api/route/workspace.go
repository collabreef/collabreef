package route

import (
	"strings"

	"github.com/collabreef/collabreef/internal/api/handler"
	"github.com/collabreef/collabreef/internal/api/middlewares"

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
	g.GET("/:workspaceId/notes/:noteId/view-objects", h.GetViewObjectsForNote)

	g.GET("/:workspaceId/files/:id", h.Download)
	g.GET("/:workspaceId/files", h.List)
	g.POST("/:workspaceId/files", h.Upload)
	g.PATCH("/:workspaceId/files/:id", h.RenameFile)
	g.DELETE("/:workspaceId/files/:id", h.Delete)

	g.GET("/:workspaceId/views", h.GetViews)
	g.POST("/:workspaceId/views", h.CreateView)
	g.GET("/:workspaceId/views/:id", h.GetView)
	g.PUT("/:workspaceId/views/:id", h.UpdateView)
	g.DELETE("/:workspaceId/views/:id", h.DeleteView)
	g.PATCH("/:workspaceId/views/:id/visibility/:visibility", h.UpdateViewVisibility)

	g.GET("/:workspaceId/views/:viewId/objects", h.GetViewObjects)
	g.POST("/:workspaceId/views/:viewId/objects", h.CreateViewObject)
	g.GET("/:workspaceId/views/:viewId/objects/:id", h.GetViewObject)
	g.PUT("/:workspaceId/views/:viewId/objects/:id", h.UpdateViewObject)
	g.DELETE("/:workspaceId/views/:viewId/objects/:id", h.DeleteViewObject)

	// View object notes
	g.GET("/:workspaceId/views/:viewId/objects/:id/notes", h.GetNotesForViewObject)
	g.POST("/:workspaceId/views/:viewId/objects/:id/notes", h.AddNoteToViewObject)
	g.DELETE("/:workspaceId/views/:viewId/objects/:id/notes/:noteId", h.RemoveNoteFromViewObject)

	// Widgets
	g.GET("/:workspaceId/widgets", h.GetWidgets)
	g.POST("/:workspaceId/widgets", h.CreateWidget)
	g.GET("/:workspaceId/widgets/:id", h.GetWidget)
	g.GET("/:workspaceId/widgets/:id/path", h.GetWidgetPath)
	g.PUT("/:workspaceId/widgets/:id", h.UpdateWidget)
	g.DELETE("/:workspaceId/widgets/:id", h.DeleteWidget)

	// Stats
	g.GET("/:workspaceId/stats/note-counts-by-date", h.GetNoteCountsByDate)

	// Workspace Members
	g.GET("/:workspaceId/members", h.GetWorkspaceMembers)
	g.POST("/:workspaceId/members", h.InviteMember)
	g.PATCH("/:workspaceId/members/:userId/role", h.UpdateMemberRole)
	g.DELETE("/:workspaceId/members/:userId", h.RemoveMember)
}
