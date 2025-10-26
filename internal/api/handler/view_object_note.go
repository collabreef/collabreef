package handler

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/unsealdev/unseal/internal/model"
)

type AddNoteToViewObjectRequest struct {
	NoteID string `json:"note_id" validate:"required"`
}

type ViewObjectNoteResponse struct {
	ViewObjectID string `json:"view_object_id"`
	NoteID       string `json:"note_id"`
	CreatedAt    string `json:"created_at"`
	CreatedBy    string `json:"created_by"`
}

// GetNotesForViewObject returns all notes associated with a view object
func (h Handler) GetNotesForViewObject(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	viewId := c.Param("viewId")
	viewObjectId := c.Param("id")

	if workspaceId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Workspace id is required")
	}

	if viewId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "View id is required")
	}

	if viewObjectId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "View object id is required")
	}

	// Verify view exists and belongs to workspace
	_, err := h.db.FindView(model.View{ID: viewId, WorkspaceID: workspaceId})
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "View not found")
	}

	// Verify view object exists and belongs to view
	_, err = h.db.FindViewObject(model.ViewObject{ID: viewObjectId, ViewID: viewId})
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "View object not found")
	}

	notes, err := h.db.FindNotesForViewObject(viewObjectId)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, notes)
}

// AddNoteToViewObject adds a note to a view object
func (h Handler) AddNoteToViewObject(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	viewId := c.Param("viewId")
	viewObjectId := c.Param("id")

	if workspaceId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Workspace id is required")
	}

	if viewId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "View id is required")
	}

	if viewObjectId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "View object id is required")
	}

	var req AddNoteToViewObjectRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := c.Validate(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Validation failed: " + err.Error(),
		})
	}

	// Verify view exists and belongs to workspace
	_, err := h.db.FindView(model.View{ID: viewId, WorkspaceID: workspaceId})
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "View not found")
	}

	// Verify view object exists and belongs to view
	_, err = h.db.FindViewObject(model.ViewObject{ID: viewObjectId, ViewID: viewId})
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "View object not found")
	}

	// Verify note exists and belongs to workspace
	note, err := h.db.FindNote(model.Note{ID: req.NoteID, WorkspaceID: workspaceId})
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Note not found")
	}

	user := c.Get("user").(model.User)

	viewObjectNote := model.ViewObjectNote{
		ViewObjectID: viewObjectId,
		NoteID:       note.ID,
		CreatedAt:    time.Now().UTC().String(),
		CreatedBy:    user.ID,
	}

	err = h.db.AddNoteToViewObject(viewObjectNote)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusCreated, ViewObjectNoteResponse{
		ViewObjectID: viewObjectNote.ViewObjectID,
		NoteID:       viewObjectNote.NoteID,
		CreatedAt:    viewObjectNote.CreatedAt,
		CreatedBy:    h.getUserNameByID(viewObjectNote.CreatedBy),
	})
}

// RemoveNoteFromViewObject removes a note from a view object
func (h Handler) RemoveNoteFromViewObject(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	viewId := c.Param("viewId")
	viewObjectId := c.Param("id")
	noteId := c.Param("noteId")

	if workspaceId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Workspace id is required")
	}

	if viewId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "View id is required")
	}

	if viewObjectId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "View object id is required")
	}

	if noteId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Note id is required")
	}

	// Verify view exists and belongs to workspace
	_, err := h.db.FindView(model.View{ID: viewId, WorkspaceID: workspaceId})
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "View not found")
	}

	// Verify view object exists and belongs to view
	_, err = h.db.FindViewObject(model.ViewObject{ID: viewObjectId, ViewID: viewId})
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "View object not found")
	}

	viewObjectNote := model.ViewObjectNote{
		ViewObjectID: viewObjectId,
		NoteID:       noteId,
	}

	err = h.db.RemoveNoteFromViewObject(viewObjectNote)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.NoContent(http.StatusNoContent)
}