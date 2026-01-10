package route

import (
	"github.com/notepia/notepia/internal/api/handler"
	"github.com/notepia/notepia/internal/api/middlewares"

	"github.com/labstack/echo/v4"
)

func RegisterWebSocket(e *echo.Echo, h handler.Handler, auth middlewares.AuthMiddleware) {
	// Create WebSocket group at root level (not under /api/v1)
	ws := e.Group("/ws")

	// Use only ParseJWT for WebSocket - it's more lenient and checks cookies
	// Don't use CheckJWT as it will block the WebSocket upgrade
	ws.Use(auth.ParseJWT())

	// WebSocket endpoint for view collaboration
	ws.GET("/views/:viewId", h.HandleViewWebSocket)

	// Hub statistics endpoint (for monitoring)
	ws.GET("/stats", h.HandleHubStats)

	// Public WebSocket endpoint for read-only access to public views
	// Uses ParseJWT middleware which allows unauthenticated access (optional auth)
	wsPublic := e.Group("/ws/public")
	wsPublic.Use(auth.ParseJWT())
	wsPublic.GET("/views/:viewId", h.HandlePublicViewWebSocket)
}
