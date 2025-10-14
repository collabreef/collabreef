package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/unsealdev/unseal/internal/model"
	"github.com/unsealdev/unseal/internal/util"

	"github.com/labstack/echo/v4"
)

type CreateNoteRequest struct {
	Visibility string        `json:"visibility"  validate:"required"`
	Blocks     []model.Block `json:"blocks"  validate:"required"`
}

type UpdateNoteRequest struct {
	Blocks []model.Block `json:"blocks"  validate:"required"`
}

type GetNoteResponse struct {
	ID         string        `json:"id"`
	Visibility string        `json:"visibility"`
	Blocks     []model.Block `json:"blocks"`
	Tags       []string      `json:"tags"`
	Files      []string      `json:"files"`
	CreatedAt  string        `json:"created_at"`
	UpdatedAt  string        `json:"updated_at"`
}

func (h Handler) GetPublicNotes(c echo.Context) error {
	pageSize := 20
	pageNumber := 1
	if ps := c.QueryParam("pageSize"); ps != "" {
		if v, err := strconv.Atoi(ps); err == nil && v > 0 {
			pageSize = v
		}
	}
	if pn := c.QueryParam("pageNumber"); pn != "" {
		if v, err := strconv.Atoi(pn); err == nil && v > 0 {
			pageNumber = v
		}
	}

	query := c.QueryParam("query")

	filter := model.NoteFilter{
		WorkspaceID: "",
		PageSize:    pageSize,
		PageNumber:  pageNumber,
		Query:       query,
	}

	notes, err := h.db.FindNotes(filter)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	var user *model.User
	if u := c.Get("user"); u != nil {
		if uu, ok := u.(model.User); ok {
			user = &uu
		}
	}

	var res []GetNoteResponse

	for _, b := range notes {
		switch b.Visibility {
		case "public", "workspace":
			res = append(res, GetNoteResponse{
				ID:         b.ID,
				Visibility: b.Visibility,
				Blocks:     b.Blocks,
				CreatedAt:  b.CreatedAt,
				UpdatedAt:  b.UpdatedAt,
			})
		case "private":
			if user != nil && b.CreatedBy == user.ID {
				res = append(res, GetNoteResponse{
					ID:         b.ID,
					Visibility: b.Visibility,
					Blocks:     b.Blocks,
					CreatedAt:  b.CreatedAt,
					UpdatedAt:  b.UpdatedAt,
				})
			}
		}
	}

	return c.JSON(http.StatusOK, res)
}

func (h Handler) GetPublicNote(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Note id is required")
	}

	b := model.Note{ID: id}
	b, err := h.db.FindNote(b)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	var user *model.User
	if u := c.Get("user"); u != nil {
		if uu, ok := u.(model.User); ok {
			user = &uu
		}
	}

	isVisible := false

	switch b.Visibility {
	case "public":
		isVisible = true
	case "workspace":
		// For workspace visibility, allow if user is authenticated
		isVisible = user != nil
	case "private":
		isVisible = user != nil && b.CreatedBy == user.ID
	}

	if !isVisible {
		return echo.NewHTTPError(http.StatusForbidden, "you do not have permission to see this Note")
	}

	res := GetNoteResponse{
		ID:         b.ID,
		Visibility: b.Visibility,
		Blocks:     b.Blocks,
		CreatedAt:  b.CreatedAt,
		UpdatedAt:  b.UpdatedAt,
	}

	return c.JSON(http.StatusOK, res)
}

func (h Handler) GetNotes(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	pageSize := 20
	pageNumber := 1
	if ps := c.QueryParam("pageSize"); ps != "" {
		if v, err := strconv.Atoi(ps); err == nil && v > 0 {
			pageSize = v
		}
	}
	if pn := c.QueryParam("pageNumber"); pn != "" {
		if v, err := strconv.Atoi(pn); err == nil && v > 0 {
			pageNumber = v
		}
	}

	query := c.QueryParam("query")

	filter := model.NoteFilter{
		WorkspaceID: workspaceId,
		PageSize:    pageSize,
		PageNumber:  pageNumber,
		Query:       query,
	}

	notes, err := h.db.FindNotes(filter)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	user := c.Get("user").(model.User)
	var res []GetNoteResponse

	for _, b := range notes {
		switch b.Visibility {
		case "public", "workspace":
			res = append(res, GetNoteResponse{
				ID:         b.ID,
				Visibility: b.Visibility,
				Blocks:     b.Blocks,
				CreatedAt:  b.CreatedAt,
				UpdatedAt:  b.UpdatedAt,
			})
		case "private":
			if b.CreatedBy == user.ID {
				res = append(res, GetNoteResponse{
					ID:         b.ID,
					Visibility: b.Visibility,
					Blocks:     b.Blocks,
					CreatedAt:  b.CreatedAt,
					UpdatedAt:  b.UpdatedAt,
				})
			}
		}
	}

	return c.JSON(http.StatusOK, res)
}

func (h Handler) GetNote(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	if workspaceId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Workspace id is required")
	}

	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Note id is required")
	}

	b := model.Note{WorkspaceID: workspaceId, ID: id}
	b, err := h.db.FindNote(b)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	user := c.Get("user").(model.User)

	isVisible := false

	switch b.Visibility {
	case "public", "workspace":
		isVisible = true
	case "private":
		isVisible = b.CreatedBy == user.ID
	}

	if !isVisible {
		return echo.NewHTTPError(http.StatusForbidden, "you do not have permission to see this Note")
	}

	res := GetNoteResponse{
		ID:         b.ID,
		Visibility: b.Visibility,
		Blocks:     b.Blocks,
		CreatedAt:  b.CreatedAt,
		UpdatedAt:  b.UpdatedAt,
	}

	return c.JSON(http.StatusOK, res)
}

func (h Handler) CreateNote(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	if workspaceId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "workspace id is required")
	}
	var req CreateNoteRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := c.Validate(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Validation failed: " + err.Error(),
		})
	}

	var n model.Note
	user := c.Get("user").(model.User)

	n.WorkspaceID = workspaceId
	n.ID = util.NewId()
	n.Visibility = req.Visibility
	n.CreatedAt = time.Now().UTC().String()
	n.CreatedBy = user.ID
	n.UpdatedAt = time.Now().UTC().String()
	n.UpdatedBy = user.ID

	for _, b := range req.Blocks {
		n.Blocks = append(n.Blocks, model.Block{
			WorkspaceID: workspaceId,
			NoteID:      n.ID,
			ID:          util.NewId(),
			Type:        b.Type,
			Data:        b.Data,
		})
	}

	err := h.db.CreateNote(n)

	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusCreated, n)
}

func (h Handler) DeleteNote(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Note id is required")
	}
	Note := model.Note{WorkspaceID: workspaceId, ID: id}

	existingNote, err := h.db.FindNote(Note)

	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	user := c.Get("user").(model.User)

	if existingNote.CreatedBy != user.ID {
		return echo.NewHTTPError(http.StatusForbidden, "you do not have permission to delete this Note")
	}

	if err := h.db.DeleteNote(Note); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.NoContent(http.StatusNoContent)
}

func (h Handler) UpdateNote(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	if workspaceId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "workspace id is required")
	}
	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Note id is required")
	}

	var req UpdateNoteRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := c.Validate(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Validation failed: " + err.Error(),
		})
	}

	existingNote, err := h.db.FindNote(model.Note{ID: id})

	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	user := c.Get("user").(model.User)

	if existingNote.CreatedBy != user.ID {
		return echo.NewHTTPError(http.StatusUnauthorized)
	}
	var n model.Note

	n.WorkspaceID = workspaceId
	n.ID = existingNote.ID
	n.CreatedAt = existingNote.CreatedAt
	n.CreatedBy = existingNote.CreatedBy
	n.UpdatedAt = time.Now().UTC().String()
	n.UpdatedBy = user.ID

	for _, b := range req.Blocks {
		n.Blocks = append(n.Blocks, model.Block{
			WorkspaceID: workspaceId,
			NoteID:      existingNote.ID,
			ID:          util.NewId(),
			Type:        b.Type,
			Data:        b.Data,
		})
	}

	err = h.db.UpdateNote(n)

	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusOK, existingNote)
}

func (h Handler) UpdateNoteVisibility(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	if workspaceId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "workspace id is required")
	}
	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Note id is required")
	}
	visibility := c.Param("visibility")
	if visibility == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Note visibility is required")
	}

	switch visibility {
	case "public", "workspace", "private":
	default:
		return echo.NewHTTPError(http.StatusBadRequest, "Note visibility is invalid")
	}

	existingNote, err := h.db.FindNote(model.Note{ID: id})

	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	user := c.Get("user").(model.User)

	if existingNote.CreatedBy != user.ID {
		return echo.NewHTTPError(http.StatusUnauthorized)
	}
	var n model.Note

	n.WorkspaceID = workspaceId
	n.ID = existingNote.ID
	n.Visibility = visibility
	n.CreatedAt = existingNote.CreatedAt
	n.CreatedBy = existingNote.CreatedBy
	n.UpdatedAt = time.Now().UTC().String()
	n.UpdatedBy = user.ID

	for _, b := range existingNote.Blocks {
		n.Blocks = append(n.Blocks, model.Block{
			WorkspaceID: workspaceId,
			NoteID:      existingNote.ID,
			ID:          util.NewId(),
			Type:        b.Type,
			Data:        b.Data,
		})
	}

	err = h.db.UpdateNote(n)

	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusOK, n)
}
