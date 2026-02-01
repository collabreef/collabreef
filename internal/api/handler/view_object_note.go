package handler

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/collabreef/collabreef/internal/model"
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

type ViewObjectWithView struct {
	ViewObject model.ViewObject `json:"view_object"`
	View       model.View       `json:"view"`
}

// GetViewObjectsForNote returns all view objects associated with a note
func (h Handler) GetViewObjectsForNote(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	noteId := c.Param("noteId")

	if workspaceId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Workspace id is required")
	}

	if noteId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Note id is required")
	}

	// Verify note exists and belongs to workspace
	_, err := h.db.FindNote(model.Note{ID: noteId, WorkspaceID: workspaceId})
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Note not found")
	}

	viewObjects, err := h.db.FindViewObjectsForNote(noteId)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Fetch the associated views for each view object
	result := make([]ViewObjectWithView, 0, len(viewObjects))
	for _, vo := range viewObjects {
		view, err := h.db.FindView(model.View{ID: vo.ViewID, WorkspaceID: workspaceId})
		if err != nil {
			// Skip if view not found (shouldn't happen in normal cases)
			continue
		}
		result = append(result, ViewObjectWithView{
			ViewObject: vo,
			View:       view,
		})
	}

	return c.JSON(http.StatusOK, result)
}

// GetPublicViewObjectsForNote returns all view objects associated with a public note
// This endpoint does not require workspace context and respects view visibility settings
func (h Handler) GetPublicViewObjectsForNote(c echo.Context) error {
	noteId := c.Param("noteId")

	if noteId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Note id is required")
	}

	// Verify note exists
	note, err := h.db.FindNote(model.Note{ID: noteId})
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Note not found")
	}

	// Check note visibility
	var user *model.User
	if u := c.Get("user"); u != nil {
		if uu, ok := u.(model.User); ok {
			user = &uu
		}
	}

	isVisible := false

	switch note.Visibility {
	case "public":
		isVisible = true
	case "workspace":
		// For workspace visibility, check if user is a member of that workspace
		isVisible = user != nil && h.isUserWorkspaceMember(user.ID, note.WorkspaceID)
	case "private":
		isVisible = user != nil && note.CreatedBy == user.ID
	}

	if !isVisible {
		return echo.NewHTTPError(http.StatusForbidden, "you do not have permission to see this Note")
	}

	// Get view objects for the note
	viewObjects, err := h.db.FindViewObjectsForNote(noteId)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Fetch the associated views for each view object and filter by visibility
	result := make([]ViewObjectWithView, 0)
	for _, vo := range viewObjects {
		view, err := h.db.FindView(model.View{ID: vo.ViewID})
		if err != nil {
			// Skip if view not found
			continue
		}

		// Filter views based on visibility
		isViewVisible := false
		switch view.Visibility {
		case "public":
			isViewVisible = true
		case "workspace":
			// For workspace visibility, check if user is a member of that workspace
			isViewVisible = user != nil && h.isUserWorkspaceMember(user.ID, view.WorkspaceID)
		case "private":
			isViewVisible = user != nil && view.CreatedBy == user.ID
		}

		if isViewVisible {
			result = append(result, ViewObjectWithView{
				ViewObject: vo,
				View:       view,
			})
		}
	}

	return c.JSON(http.StatusOK, result)
}

// GetPublicNotesForViewObject returns all public notes associated with a view object
// This endpoint does not require workspace context and respects note visibility settings
func (h Handler) GetPublicNotesForViewObject(c echo.Context) error {
	viewId := c.Param("viewId")
	viewObjectId := c.Param("id")

	if viewId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "View id is required")
	}

	if viewObjectId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "View object id is required")
	}

	// Verify view exists
	view, err := h.db.FindView(model.View{ID: viewId})
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "View not found")
	}

	// Check view visibility
	var user *model.User
	if u := c.Get("user"); u != nil {
		if uu, ok := u.(model.User); ok {
			user = &uu
		}
	}

	isViewVisible := false
	switch view.Visibility {
	case "public":
		isViewVisible = true
	case "workspace":
		// For workspace visibility, check if user is a member of that workspace
		isViewVisible = user != nil && h.isUserWorkspaceMember(user.ID, view.WorkspaceID)
	case "private":
		isViewVisible = user != nil && view.CreatedBy == user.ID
	}

	if !isViewVisible {
		return echo.NewHTTPError(http.StatusForbidden, "you do not have permission to see this View")
	}

	// Verify view object exists and belongs to view
	_, err = h.db.FindViewObject(model.ViewObject{ID: viewObjectId, ViewID: viewId})
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "View object not found")
	}

	// Get all notes for the view object
	notes, err := h.db.FindNotesForViewObject(viewObjectId)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Filter notes based on visibility
	visibleNotes := make([]model.Note, 0)
	for _, note := range notes {
		isNoteVisible := false
		switch note.Visibility {
		case "public":
			isNoteVisible = true
		case "workspace":
			// For workspace visibility, check if user is a member of that workspace
			isNoteVisible = user != nil && h.isUserWorkspaceMember(user.ID, note.WorkspaceID)
		case "private":
			isNoteVisible = user != nil && note.CreatedBy == user.ID
		}

		if isNoteVisible {
			visibleNotes = append(visibleNotes, note)
		}
	}

	return c.JSON(http.StatusOK, visibleNotes)
}