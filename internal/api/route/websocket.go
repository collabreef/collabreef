package route

import (
	"github.com/collabreef/collabreef/internal/api/handler"
	"github.com/collabreef/collabreef/internal/api/middlewares"

	"github.com/labstack/echo/v4"
)

func RegisterWebSocket(e *echo.Echo, h handler.Handler, auth middlewares.AuthMiddleware) {
	// Create WebSocket group at root level (not under /api/v1)
	ws := e.Group("/ws")

	ws.Use(auth.ParseJWT())
	ws.Use(auth.CheckJWT())

	// WebSocket endpoint for view collaboration
	ws.GET("/views/:viewId", h.HandleViewWebSocket)

	// WebSocket endpoint for note collaboration
	ws.GET("/notes/:noteId", h.HandleNoteWebSocket)

	// Hub statistics endpoint (for monitoring)
	ws.GET("/stats", h.HandleHubStats)

	// Public WebSocket endpoint for read-only access to public views
	// Uses ParseJWT middleware which allows unauthenticated access (optional auth)
	wsPublic := e.Group("/ws/public")
	wsPublic.Use(auth.ParseJWT())
	wsPublic.GET("/views/:viewId", h.HandlePublicViewWebSocket)
}
