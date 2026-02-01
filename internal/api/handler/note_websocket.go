package handler

import (
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/collabreef/collabreef/internal/model"
	ws "github.com/collabreef/collabreef/internal/websocket"
)

// HandleNoteWebSocket handles WebSocket connections for note collaboration
func (h *Handler) HandleNoteWebSocket(c echo.Context) error {
	// Get note ID from URL path
	noteID := c.Param("noteId")

	log.Printf("Note WebSocket connection request:")
	log.Printf("  - Full Path: %s", c.Request().URL.Path)
	log.Printf("  - NoteID param: %s", noteID)

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
		// Everyone can access public notes
		hasAccess = true
	case "workspace":
		// Check if user is a workspace member
		hasAccess = h.isUserWorkspaceMember(user.ID, note.WorkspaceID)
	case "private":
		// Only creator can access private notes
		hasAccess = note.CreatedBy == user.ID
	default:
		hasAccess = false
	}

	if !hasAccess {
		return echo.NewHTTPError(http.StatusForbidden, "You do not have permission to access this note")
	}

	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return err
	}

	// Get or create note room
	room := h.hub.GetOrCreateNoteRoom(noteID)
	log.Printf("Using note room for note %s", noteID)

	// Create standard client (sends binary messages for Y.js)
	// JSON messages (title updates) are also sent as binary (UTF-8 bytes)
	client := ws.NewClient(conn, user.ID, user.Name, noteID, room)

	// Register client with the room
	room.Register(client)

	// Start client's read and write pumps
	client.Run()

	return nil
}
