package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/collabreef/collabreef/internal/model"
	"github.com/collabreef/collabreef/internal/util"

	"github.com/labstack/echo/v4"
)

type CreateViewObjectRequest struct {
	Name string `json:"name" validate:"required"`
	Type string `json:"type" validate:"required"`
	Data string `json:"data"`
}

type UpdateViewObjectRequest struct {
	Name string `json:"name"`
	Type string `json:"type"`
	Data string `json:"data"`
}

type GetViewObjectResponse struct {
	ID        string `json:"id"`
	ViewID    string `json:"view_id"`
	Name      string `json:"name"`
	Type      string `json:"type"`
	Data      string `json:"data"`
	CreatedAt string `json:"created_at"`
	CreatedBy string `json:"created_by"`
	UpdatedAt string `json:"updated_at"`
	UpdatedBy string `json:"updated_by"`
}

func (h Handler) GetViewObjects(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	viewId := c.Param("viewId")

	pageSize := 100
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

	objectType := c.QueryParam("type")

	// Verify view exists and belongs to workspace
	view, err := h.db.FindView(model.View{ID: viewId, WorkspaceID: workspaceId})
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "View not found")
	}

	filter := model.ViewObjectFilter{
		ViewID:     view.ID,
		ObjectType: objectType,
		PageSize:   pageSize,
		PageNumber: pageNumber,
	}

	viewObjects, err := h.db.FindViewObjects(filter)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	res := []GetViewObjectResponse{}

	for _, vo := range viewObjects {
		res = append(res, GetViewObjectResponse{
			ID:        vo.ID,
			ViewID:    vo.ViewID,
			Name:      vo.Name,
			Type:      vo.Type,
			Data:      vo.Data,
			CreatedAt: vo.CreatedAt,
			CreatedBy: h.getUserNameByID(vo.CreatedBy),
			UpdatedAt: vo.UpdatedAt,
			UpdatedBy: h.getUserNameByID(vo.UpdatedBy),
		})
	}

	return c.JSON(http.StatusOK, res)
}

func (h Handler) GetViewObject(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	viewId := c.Param("viewId")
	id := c.Param("id")

	if workspaceId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Workspace id is required")
	}

	if viewId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "View id is required")
	}

	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "View object id is required")
	}

	// Verify view exists and belongs to workspace
	_, err := h.db.FindView(model.View{ID: viewId, WorkspaceID: workspaceId})
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "View not found")
	}

	vo := model.ViewObject{ID: id, ViewID: viewId}
	vo, err = h.db.FindViewObject(vo)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	res := GetViewObjectResponse{
		ID:        vo.ID,
		ViewID:    vo.ViewID,
		Name:      vo.Name,
		Type:      vo.Type,
		Data:      vo.Data,
		CreatedAt: vo.CreatedAt,
		CreatedBy: h.getUserNameByID(vo.CreatedBy),
		UpdatedAt: vo.UpdatedAt,
		UpdatedBy: h.getUserNameByID(vo.UpdatedBy),
	}

	return c.JSON(http.StatusOK, res)
}

func (h Handler) CreateViewObject(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	viewId := c.Param("viewId")

	if workspaceId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "workspace id is required")
	}

	if viewId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "view id is required")
	}

	var req CreateViewObjectRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := c.Validate(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Validation failed: " + err.Error(),
		})
	}

	// Verify view exists and belongs to workspace
	view, err := h.db.FindView(model.View{ID: viewId, WorkspaceID: workspaceId})
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "View not found")
	}

	// Validate object type based on view type
	if view.Type == "calendar" && req.Type != "calendar_slot" {
		return echo.NewHTTPError(http.StatusBadRequest, "Object type must be 'calendar_slot' for calendar views")
	}
	if view.Type == "map" && req.Type != "map_marker" {
		return echo.NewHTTPError(http.StatusBadRequest, "Object type must be 'map_marker' for map views")
	}
	if view.Type == "kanban" && req.Type != "kanban_column" {
		return echo.NewHTTPError(http.StatusBadRequest, "Object type must be 'kanban_column' for kanban views")
	}

	user := c.Get("user").(model.User)

	vo := model.ViewObject{
		ID:        util.NewId(),
		ViewID:    viewId,
		Name:      req.Name,
		Type:      req.Type,
		Data:      req.Data,
		CreatedAt: time.Now().UTC().String(),
		CreatedBy: user.ID,
		UpdatedAt: time.Now().UTC().String(),
		UpdatedBy: user.ID,
	}

	err = h.db.CreateViewObject(vo)

	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusCreated, vo)
}

func (h Handler) UpdateViewObject(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	viewId := c.Param("viewId")
	id := c.Param("id")

	if workspaceId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "workspace id is required")
	}

	if viewId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "view id is required")
	}

	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "View object id is required")
	}

	var req UpdateViewObjectRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := c.Validate(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Validation failed: " + err.Error(),
		})
	}

	// Verify view exists and belongs to workspace
	view, err := h.db.FindView(model.View{ID: viewId, WorkspaceID: workspaceId})
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "View not found")
	}

	existingViewObject, err := h.db.FindViewObject(model.ViewObject{ID: id, ViewID: viewId})

	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// Validate object type based on view type if type is being changed
	if req.Type != "" && view.Type == "calendar" && req.Type != "calendar_slot" {
		return echo.NewHTTPError(http.StatusBadRequest, "Object type must be 'calendar_slot' for calendar views")
	}
	if req.Type != "" && view.Type == "map" && req.Type != "map_marker" {
		return echo.NewHTTPError(http.StatusBadRequest, "Object type must be 'map_marker' for map views")
	}
	if req.Type != "" && view.Type == "kanban" && req.Type != "kanban_column" {
		return echo.NewHTTPError(http.StatusBadRequest, "Object type must be 'kanban_column' for kanban views")
	}

	user := c.Get("user").(model.User)

	vo := model.ViewObject{
		ID:        existingViewObject.ID,
		ViewID:    existingViewObject.ViewID,
		Name:      req.Name,
		Type:      req.Type,
		Data:      req.Data,
		CreatedAt: existingViewObject.CreatedAt,
		CreatedBy: existingViewObject.CreatedBy,
		UpdatedAt: time.Now().UTC().String(),
		UpdatedBy: user.ID,
	}

	// If fields are empty, keep existing values
	if vo.Name == "" {
		vo.Name = existingViewObject.Name
	}
	if vo.Type == "" {
		vo.Type = existingViewObject.Type
	}
	if vo.Data == "" {
		vo.Data = existingViewObject.Data
	}

	err = h.db.UpdateViewObject(vo)

	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusOK, vo)
}

func (h Handler) DeleteViewObject(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	viewId := c.Param("viewId")
	id := c.Param("id")

	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "View object id is required")
	}

	// Verify view exists and belongs to workspace
	_, err := h.db.FindView(model.View{ID: viewId, WorkspaceID: workspaceId})
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "View not found")
	}

	viewObject := model.ViewObject{ID: id, ViewID: viewId}

	_, err = h.db.FindViewObject(viewObject)

	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := h.db.DeleteViewObject(viewObject); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.NoContent(http.StatusNoContent)
}

// GetPublicViewObjects returns all view objects for a public view
// This endpoint does not require workspace context and respects view visibility settings
func (h Handler) GetPublicViewObjects(c echo.Context) error {
	viewId := c.Param("viewId")

	if viewId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "View id is required")
	}

	pageSize := 100
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

	objectType := c.QueryParam("type")

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

	isVisible := false

	switch view.Visibility {
	case "public":
		isVisible = true
	case "workspace":
		// For workspace visibility, check if user is a member of that workspace
		isVisible = user != nil && h.isUserWorkspaceMember(user.ID, view.WorkspaceID)
	case "private":
		isVisible = user != nil && view.CreatedBy == user.ID
	}

	if !isVisible {
		return echo.NewHTTPError(http.StatusForbidden, "you do not have permission to see this View")
	}

	// Get view objects for the view
	filter := model.ViewObjectFilter{
		ViewID:     view.ID,
		ObjectType: objectType,
		PageSize:   pageSize,
		PageNumber: pageNumber,
	}

	viewObjects, err := h.db.FindViewObjects(filter)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	res := []GetViewObjectResponse{}

	for _, vo := range viewObjects {
		res = append(res, GetViewObjectResponse{
			ID:        vo.ID,
			ViewID:    vo.ViewID,
			Name:      vo.Name,
			Type:      vo.Type,
			Data:      vo.Data,
			CreatedAt: vo.CreatedAt,
			CreatedBy: h.getUserNameByID(vo.CreatedBy),
			UpdatedAt: vo.UpdatedAt,
			UpdatedBy: h.getUserNameByID(vo.UpdatedBy),
		})
	}

	return c.JSON(http.StatusOK, res)
}
// GetPublicViewObject returns a single view object for a public view
// This endpoint does not require workspace context and respects view visibility settings
func (h Handler) GetPublicViewObject(c echo.Context) error {
	viewId := c.Param("viewId")
	id := c.Param("id")

	if viewId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "View id is required")
	}

	if id == "" {
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

	isVisible := false

	switch view.Visibility {
	case "public":
		isVisible = true
	case "workspace":
		// For workspace visibility, check if user is a member of that workspace
		isVisible = user != nil && h.isUserWorkspaceMember(user.ID, view.WorkspaceID)
	case "private":
		isVisible = user != nil && view.CreatedBy == user.ID
	}

	if !isVisible {
		return echo.NewHTTPError(http.StatusForbidden, "you do not have permission to see this View")
	}

	// Get the view object
	vo := model.ViewObject{ID: id, ViewID: viewId}
	vo, err = h.db.FindViewObject(vo)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "View object not found")
	}

	res := GetViewObjectResponse{
		ID:        vo.ID,
		ViewID:    vo.ViewID,
		Name:      vo.Name,
		Type:      vo.Type,
		Data:      vo.Data,
		CreatedAt: vo.CreatedAt,
		CreatedBy: h.getUserNameByID(vo.CreatedBy),
		UpdatedAt: vo.UpdatedAt,
		UpdatedBy: h.getUserNameByID(vo.UpdatedBy),
	}

	return c.JSON(http.StatusOK, res)
}
