package handler

import (
	"log"
	"net/http"
	"net/http/httputil"

	"github.com/labstack/echo/v4"
	"github.com/collabreef/collabreef/internal/model"
)

// proxyToCollab reverse-proxies the request to the collab service with custom headers
func (h *Handler) proxyToCollab(c echo.Context, headers map[string]string) error {
	proxy := httputil.NewSingleHostReverseProxy(h.collabURL)

	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		for k, v := range headers {
			req.Header.Set(k, v)
		}
	}

	proxy.ServeHTTP(c.Response(), c.Request())
	return nil
}

// HandleViewWebSocket handles WebSocket connections for a specific view
func (h *Handler) HandleViewWebSocket(c echo.Context) error {
	viewID := c.Param("viewId")

	if viewID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "View ID is required")
	}

	// Get authenticated user from context
	user, ok := c.Get("user").(model.User)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "User not authenticated")
	}

	// Verify the view exists and user has access
	view, err := h.db.FindView(model.View{ID: viewID})
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "View not found")
	}

	log.Printf("WebSocket proxy: user=%s, viewId=%s, type=%s", user.ID, viewID, view.Type)

	// Reverse proxy to collab service with user info headers
	return h.proxyToCollab(c, map[string]string{
		"X-User-ID":   user.ID,
		"X-User-Name": user.Name,
		"X-View-Type": view.Type,
		"X-Read-Only": "false",
	})
}

// HandlePublicViewWebSocket handles WebSocket connections for public views (read-only)
func (h *Handler) HandlePublicViewWebSocket(c echo.Context) error {
	viewID := c.Param("viewId")

	if viewID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "View ID is required")
	}

	// Verify the view exists and is accessible
	view, err := h.db.FindView(model.View{ID: viewID})
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "View not found")
	}

	// Get user from context (may be nil for unauthenticated users)
	var user *model.User
	if u := c.Get("user"); u != nil {
		if uu, ok := u.(model.User); ok {
			user = &uu
		}
	}

	// Check visibility permissions
	isVisible := false
	switch view.Visibility {
	case "public":
		isVisible = true
	case "workspace":
		isVisible = user != nil && h.isUserWorkspaceMember(user.ID, view.WorkspaceID)
	case "private":
		isVisible = user != nil && view.CreatedBy == user.ID
	}

	if !isVisible {
		return echo.NewHTTPError(http.StatusForbidden, "You do not have permission to access this view")
	}

	userID := "anonymous"
	userName := "Anonymous"
	if user != nil {
		userID = user.ID
		userName = user.Name
	}

	log.Printf("Public WebSocket proxy: user=%s, viewId=%s, type=%s", userID, viewID, view.Type)

	return h.proxyToCollab(c, map[string]string{
		"X-User-ID":   userID,
		"X-User-Name": userName,
		"X-View-Type": view.Type,
		"X-Read-Only": "true",
	})
}
