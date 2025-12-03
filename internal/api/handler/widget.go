package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/unsealdev/unseal/internal/model"
	"github.com/unsealdev/unseal/internal/util"

	"github.com/labstack/echo/v4"
)

type CreateWidgetRequest struct {
	Type     string `json:"type" validate:"required"`
	Config   string `json:"config"`
	Position string `json:"position"`
}

type UpdateWidgetRequest struct {
	Type     string `json:"type"`
	Config   string `json:"config"`
	Position string `json:"position"`
}

type GetWidgetResponse struct {
	ID        string `json:"id"`
	Type      string `json:"type"`
	Config    string `json:"config"`
	Position  string `json:"position"`
	CreatedAt string `json:"created_at"`
	CreatedBy string `json:"created_by"`
	UpdatedAt string `json:"updated_at"`
	UpdatedBy string `json:"updated_by"`
}

func (h Handler) GetWidgets(c echo.Context) error {
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
	widgetType := c.QueryParam("type")

	filter := model.WidgetFilter{
		WorkspaceID: workspaceId,
		PageSize:    pageSize,
		PageNumber:  pageNumber,
		Query:       query,
		Type:        widgetType,
	}

	widgets, err := h.db.FindWidgets(filter)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	var res []GetWidgetResponse
	for _, w := range widgets {
		res = append(res, GetWidgetResponse{
			ID:        w.ID,
			Type:      w.Type,
			Config:    w.Config,
			Position:  w.Position,
			CreatedAt: w.CreatedAt,
			CreatedBy: h.getUserNameByID(w.CreatedBy),
			UpdatedAt: w.UpdatedAt,
			UpdatedBy: h.getUserNameByID(w.UpdatedBy),
		})
	}

	return c.JSON(http.StatusOK, res)
}

func (h Handler) GetWidget(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	if workspaceId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Workspace id is required")
	}

	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Widget id is required")
	}

	w := model.Widget{WorkspaceID: workspaceId, ID: id}
	w, err := h.db.FindWidget(w)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	res := GetWidgetResponse{
		ID:        w.ID,
		Type:      w.Type,
		Config:    w.Config,
		Position:  w.Position,
		CreatedAt: w.CreatedAt,
		CreatedBy: h.getUserNameByID(w.CreatedBy),
		UpdatedAt: w.UpdatedAt,
		UpdatedBy: h.getUserNameByID(w.UpdatedBy),
	}

	return c.JSON(http.StatusOK, res)
}

func (h Handler) CreateWidget(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	if workspaceId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "workspace id is required")
	}
	var req CreateWidgetRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := c.Validate(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Validation failed: " + err.Error(),
		})
	}

	// Validate widget type
	validTypes := map[string]bool{
		"note_form":     true,
		"stats":         true,
		"template_form": true,
		"view":          true,
		"note":          true,
		"latest_note":   true,
		"countdown":     true,
		"file_upload":   true,
	}
	if !validTypes[req.Type] {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid widget type")
	}

	var w model.Widget
	user := c.Get("user").(model.User)

	w.WorkspaceID = workspaceId
	w.ID = util.NewId()
	w.Type = req.Type
	w.Config = req.Config
	w.Position = req.Position
	w.CreatedAt = time.Now().UTC().String()
	w.CreatedBy = user.ID
	w.UpdatedAt = time.Now().UTC().String()
	w.UpdatedBy = user.ID

	err := h.db.CreateWidget(w)

	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusCreated, w)
}

func (h Handler) UpdateWidget(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	if workspaceId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "workspace id is required")
	}
	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Widget id is required")
	}

	var req UpdateWidgetRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := c.Validate(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Validation failed: " + err.Error(),
		})
	}

	existingWidget, err := h.db.FindWidget(model.Widget{ID: id})

	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	user := c.Get("user").(model.User)

	// Any workspace member can update widgets (no ownership check needed)
	var w model.Widget

	w.WorkspaceID = workspaceId
	w.ID = existingWidget.ID
	w.Type = req.Type
	if w.Type == "" {
		w.Type = existingWidget.Type
	}
	w.Config = req.Config
	if w.Config == "" {
		w.Config = existingWidget.Config
	}
	w.Position = req.Position
	if w.Position == "" {
		w.Position = existingWidget.Position
	}
	w.CreatedAt = existingWidget.CreatedAt
	w.CreatedBy = existingWidget.CreatedBy
	w.UpdatedAt = time.Now().UTC().String()
	w.UpdatedBy = user.ID

	err = h.db.UpdateWidget(w)

	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusOK, w)
}

func (h Handler) DeleteWidget(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Widget id is required")
	}
	widget := model.Widget{WorkspaceID: workspaceId, ID: id}

	// Verify widget exists
	_, err := h.db.FindWidget(widget)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// Any workspace member can delete widgets (no ownership check needed)
	if err := h.db.DeleteWidget(widget); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.NoContent(http.StatusNoContent)
}