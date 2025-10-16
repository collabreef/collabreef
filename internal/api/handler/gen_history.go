package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/unsealdev/unseal/internal/model"
)

type GetGenHistoryResponse struct {
	ID               string `json:"id"`
	WorkspaceID      string `json:"workspace_id"`
	TemplateID       string `json:"template_id"`
	RequestPrompt    string `json:"request_prompt"`
	RequestModel     string `json:"request_model"`
	RequestModality  string `json:"request_modality"`
	RequestImageURLs string `json:"request_image_urls"`
	ResponseContent  string `json:"response_content"`
	ResponseError    string `json:"response_error"`
	CreatedAt        string `json:"created_at"`
	CreatedBy        string `json:"created_by"`
}

func (h Handler) GetGenHistories(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	templateId := c.QueryParam("templateId")

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

	filter := model.GenHistoryFilter{
		WorkspaceID: workspaceId,
		TemplateID:  templateId,
		PageSize:    pageSize,
		PageNumber:  pageNumber,
	}

	histories, err := h.db.FindGenHistories(filter)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	res := make([]GetGenHistoryResponse, 0)
	for _, h := range histories {
		res = append(res, GetGenHistoryResponse{
			ID:               h.ID,
			WorkspaceID:      h.WorkspaceID,
			TemplateID:       h.TemplateID,
			RequestPrompt:    h.RequestPrompt,
			RequestModel:     h.RequestModel,
			RequestModality:  h.RequestModality,
			RequestImageURLs: h.RequestImageURLs,
			ResponseContent:  h.ResponseContent,
			ResponseError:    h.ResponseError,
			CreatedAt:        h.CreatedAt,
			CreatedBy:        h.CreatedBy,
		})
	}

	return c.JSON(http.StatusOK, res)
}

func (h Handler) GetGenHistory(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	if workspaceId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Workspace id is required")
	}

	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "GenHistory id is required")
	}

	history := model.GenHistory{WorkspaceID: workspaceId, ID: id}
	history, err := h.db.FindGenHistory(history)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	res := GetGenHistoryResponse{
		ID:               history.ID,
		WorkspaceID:      history.WorkspaceID,
		TemplateID:       history.TemplateID,
		RequestPrompt:    history.RequestPrompt,
		RequestModel:     history.RequestModel,
		RequestModality:  history.RequestModality,
		RequestImageURLs: history.RequestImageURLs,
		ResponseContent:  history.ResponseContent,
		ResponseError:    history.ResponseError,
		CreatedAt:        history.CreatedAt,
		CreatedBy:        history.CreatedBy,
	}

	return c.JSON(http.StatusOK, res)
}

func (h Handler) DeleteGenHistory(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "GenHistory id is required")
	}

	history := model.GenHistory{WorkspaceID: workspaceId, ID: id}

	existingHistory, err := h.db.FindGenHistory(history)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	user := c.Get("user").(model.User)

	if existingHistory.CreatedBy != user.ID {
		return echo.NewHTTPError(http.StatusForbidden, "you do not have permission to delete this GenHistory")
	}

	if err := h.db.DeleteGenHistory(history); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.NoContent(http.StatusNoContent)
}