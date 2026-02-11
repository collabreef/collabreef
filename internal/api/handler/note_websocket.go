package handler

import (
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/collabreef/collabreef/internal/model"
	"github.com/collabreef/collabreef/internal/redis"
)

// HandleNoteWebSocket handles WebSocket connections for note collaboration
func (h *Handler) HandleNoteWebSocket(c echo.Context) error {
	noteID := c.Param("noteId")

	if noteID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Note ID is required")
	}

	// Get authenticated user from context
	user, ok := c.Get("user").(model.User)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "User not authenticated")
	}

	// Verify the note exists
	note, err := h.db.FindNote(model.Note{ID: noteID})
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Note not found")
	}

	// Check access permissions based on visibility
	hasAccess := false
	switch note.Visibility {
	case "public":
		hasAccess = true
	case "workspace":
		hasAccess = h.isUserWorkspaceMember(user.ID, note.WorkspaceID)
	case "private":
		hasAccess = note.CreatedBy == user.ID
	default:
		hasAccess = false
	}

	if !hasAccess {
		return echo.NewHTTPError(http.StatusForbidden, "You do not have permission to access this note")
	}

	// Pre-warm Redis cache with note data so the collab service can initialize without DB access
	existing, err := h.noteCache.GetNoteData(c.Request().Context(), noteID)
	if err != nil || existing == nil {
		noteData := &redis.NoteData{
			Title:      note.Title,
			Content:    note.Content,
			Visibility: note.Visibility,
			CreatedAt:  note.CreatedAt,
			CreatedBy:  note.CreatedBy,
			UpdatedAt:  note.UpdatedAt,
			UpdatedBy:  note.UpdatedBy,
		}
		if err := h.noteCache.SetNoteData(c.Request().Context(), noteID, noteData); err != nil {
			log.Printf("Warning: failed to pre-warm note cache: %v", err)
		} else {
			log.Printf("Pre-warmed Redis cache for note %s", noteID)
		}
	}

	log.Printf("Note WebSocket proxy: user=%s, noteId=%s", user.ID, noteID)

	return h.proxyToCollab(c, map[string]string{
		"X-User-ID":   user.ID,
		"X-User-Name": user.Name,
		"X-Read-Only": "false",
	})
}
