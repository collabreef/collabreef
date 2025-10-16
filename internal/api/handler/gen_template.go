package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/unsealdev/unseal/internal/model"
	"github.com/unsealdev/unseal/internal/util"

	"github.com/labstack/echo/v4"
)

type CreateGenTemplateRequest struct {
	Name      string `json:"name" validate:"required"`
	Prompt    string `json:"prompt" validate:"required"`
	Model     string `json:"model" validate:"required"`
	Modality  string `json:"modality" validate:"required"`
	ImageURLs string `json:"image_urls"`
}

type UpdateGenTemplateRequest struct {
	Name      string `json:"name" validate:"required"`
	Prompt    string `json:"prompt" validate:"required"`
	Model     string `json:"model" validate:"required"`
	Modality  string `json:"modality" validate:"required"`
	ImageURLs string `json:"image_urls"`
}

type GetGenTemplateResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Prompt      string `json:"prompt"`
	Model       string `json:"model"`
	Modality    string `json:"modality"`
	ImageURLs   string `json:"image_urls"`
	CreatedAt   string `json:"created_at"`
	CreatedBy   string `json:"created_by"`
	UpdatedAt   string `json:"updated_at"`
	UpdatedBy   string `json:"updated_by"`
	WorkspaceID string `json:"workspace_id"`
}

func (h Handler) GetGenTemplates(c echo.Context) error {
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

	filter := model.GenTemplateFilter{
		WorkspaceID: workspaceId,
		PageSize:    pageSize,
		PageNumber:  pageNumber,
		Query:       query,
	}

	templates, err := h.db.FindGenTemplates(filter)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	res := make([]GetGenTemplateResponse, 0)
	for _, t := range templates {
		res = append(res, GetGenTemplateResponse{
			ID:          t.ID,
			Name:        t.Name,
			Prompt:      t.Prompt,
			Model:       t.Model,
			Modality:    t.Modality,
			ImageURLs:   t.ImageURLs,
			CreatedAt:   t.CreatedAt,
			CreatedBy:   t.CreatedBy,
			UpdatedAt:   t.UpdatedAt,
			UpdatedBy:   t.UpdatedBy,
			WorkspaceID: t.WorkspaceID,
		})
	}

	return c.JSON(http.StatusOK, res)
}

func (h Handler) GetGenTemplate(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	if workspaceId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Workspace id is required")
	}

	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "GenTemplate id is required")
	}

	t := model.GenTemplate{WorkspaceID: workspaceId, ID: id}
	t, err := h.db.FindGenTemplate(t)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	res := GetGenTemplateResponse{
		ID:          t.ID,
		Name:        t.Name,
		Prompt:      t.Prompt,
		Model:       t.Model,
		Modality:    t.Modality,
		ImageURLs:   t.ImageURLs,
		CreatedAt:   t.CreatedAt,
		CreatedBy:   t.CreatedBy,
		UpdatedAt:   t.UpdatedAt,
		UpdatedBy:   t.UpdatedBy,
		WorkspaceID: t.WorkspaceID,
	}

	return c.JSON(http.StatusOK, res)
}

func (h Handler) CreateGenTemplate(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	if workspaceId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "workspace id is required")
	}
	var req CreateGenTemplateRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := c.Validate(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Validation failed: " + err.Error(),
		})
	}

	var t model.GenTemplate
	user := c.Get("user").(model.User)

	t.WorkspaceID = workspaceId
	t.ID = util.NewId()
	t.Name = req.Name
	t.Prompt = req.Prompt
	t.Model = req.Model
	t.Modality = req.Modality
	t.ImageURLs = req.ImageURLs
	t.CreatedAt = time.Now().UTC().String()
	t.CreatedBy = user.ID
	t.UpdatedAt = time.Now().UTC().String()
	t.UpdatedBy = user.ID

	err := h.db.CreateGenTemplate(t)

	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusCreated, t)
}

func (h Handler) DeleteGenTemplate(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "GenTemplate id is required")
	}
	template := model.GenTemplate{WorkspaceID: workspaceId, ID: id}

	existingTemplate, err := h.db.FindGenTemplate(template)

	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	user := c.Get("user").(model.User)

	if existingTemplate.CreatedBy != user.ID {
		return echo.NewHTTPError(http.StatusForbidden, "you do not have permission to delete this GenTemplate")
	}

	if err := h.db.DeleteGenTemplate(template); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.NoContent(http.StatusNoContent)
}

func (h Handler) UpdateGenTemplate(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	if workspaceId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "workspace id is required")
	}
	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "GenTemplate id is required")
	}

	var req UpdateGenTemplateRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := c.Validate(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Validation failed: " + err.Error(),
		})
	}

	existingTemplate, err := h.db.FindGenTemplate(model.GenTemplate{ID: id})

	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	user := c.Get("user").(model.User)

	if existingTemplate.CreatedBy != user.ID {
		return echo.NewHTTPError(http.StatusUnauthorized)
	}

	var t model.GenTemplate

	t.WorkspaceID = workspaceId
	t.ID = existingTemplate.ID
	t.Name = req.Name
	t.Prompt = req.Prompt
	t.Model = req.Model
	t.Modality = req.Modality
	t.ImageURLs = req.ImageURLs
	t.CreatedAt = existingTemplate.CreatedAt
	t.CreatedBy = existingTemplate.CreatedBy
	t.UpdatedAt = time.Now().UTC().String()
	t.UpdatedBy = user.ID

	err = h.db.UpdateGenTemplate(t)

	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusOK, t)
}