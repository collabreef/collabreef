package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/pinbook/pinbook/internal/model"
	"github.com/pinbook/pinbook/internal/util"

	"github.com/labstack/echo/v4"
)

type CreateWorkspaceRequest struct {
	Name string `json:"name" validate:"required"`
}

type UpdateWorkspaceRequest struct {
	Name string `json:"name" validate:"required"`
}

func (h Handler) GetWorkspaces(c echo.Context) error {
	user := c.Get("user").(model.User)

	db, err := h.db.Begin(context.Background())
	defer db.Rollback()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	f := model.WorkspaceUserFilter{
		UserID: user.ID,
	}

	workspaceUsers, err := db.FindWorkspaceUsers(f)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	var workspaceIDs []string
	for _, wu := range workspaceUsers {
		workspaceIDs = append(workspaceIDs, wu.WorkspaceID)
	}

	workspaces, err := db.FindWorkspaces(model.WorkspaceFilter{WorkspaceIDs: workspaceIDs})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	if err := db.Commit(); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, workspaces)
}

func (h Handler) GetWorkspace(c echo.Context) error {
	id := c.Param("workspaceId")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "workspace id is required")
	}

	workspace, err := h.db.FindWorkspaceByID(id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, workspace)
}

func (h Handler) CreateWorkspace(c echo.Context) error {
	var req CreateWorkspaceRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := c.Validate(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Validation failed: " + err.Error(),
		})
	}

	user := c.Get("user").(model.User)

	workspace := model.Workspace{
		ID:        util.NewId(),
		Name:      req.Name,
		CreatedAt: time.Now().UTC().String(),
		CreatedBy: user.ID,
	}

	db, err := h.db.Begin(context.Background())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	if err := db.CreateWorkspace(workspace); err != nil {
		db.Rollback()
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	wu := model.WorkspaceUser{
		WorkspaceID: workspace.ID,
		UserID:      user.ID,
		Role:        model.WorkspaceUserRoleOwner,
		CreatedAt:   time.Now().UTC().String(),
		CreatedBy:   user.ID,
	}

	if err := db.CreateWorkspaceUser(wu); err != nil {
		db.Rollback()
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	err = db.Commit()

	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	w, err := h.db.FindWorkspaceByID(workspace.ID)

	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusCreated, w)
}

func (h Handler) DeleteWorkspace(c echo.Context) error {
	id := c.Param("workspaceId")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "workspace id is required")
	}

	db, err := h.db.Begin(context.Background())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	defer db.Rollback()

	users, err := db.FindWorkspaceUsers(model.WorkspaceUserFilter{WorkspaceID: id})

	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	user := c.Get("user").(model.User)
	var member model.WorkspaceUser

	for _, m := range users {
		if m.UserID == user.ID {
			member = m
		}
	}

	if member.UserID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Workspace member could not be found")
	}

	if member.Role != model.WorkspaceUserRoleOwner {
		return echo.NewHTTPError(http.StatusForbidden, "Only the workspace owner can delete the workspace.")
	}

	if err := db.DeleteWorkspace(id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	if err := db.Commit(); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.NoContent(http.StatusNoContent)
}

func (h Handler) UpdateWorkspace(c echo.Context) error {
	id := c.Param("workspaceId")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "workspace id is required")
	}

	var req UpdateWorkspaceRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := c.Validate(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Validation failed: " + err.Error(),
		})
	}

	db, err := h.db.Begin(context.Background())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	defer db.Rollback()

	users, err := db.FindWorkspaceUsers(model.WorkspaceUserFilter{WorkspaceID: id})

	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	user := c.Get("user").(model.User)
	var member model.WorkspaceUser

	for _, u := range users {
		if u.UserID == user.ID {
			member = u
		}
	}

	if member.UserID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "workspace member not found")
	}

	if member.Role != model.WorkspaceUserRoleOwner && member.Role != model.WorkspaceUserRoleAdmin {
		return echo.NewHTTPError(http.StatusForbidden, "Only the workspace owner or admin can delete the workspace.")
	}

	workspace := model.Workspace{
		ID:        id,
		Name:      req.Name,
		UpdatedBy: user.ID,
		UpdatedAt: time.Now().UTC().String(),
	}

	if err := db.UpdateWorkspace(workspace); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	if err := db.Commit(); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, workspace)
}
