package middlewares

import (
	"net/http"

	"github.com/collabreef/collabreef/internal/config"
	"github.com/collabreef/collabreef/internal/db"
	"github.com/collabreef/collabreef/internal/model"

	"github.com/labstack/echo/v4"
)

type WorkspaceMiddleware struct {
	db db.DB
}

func NewWorkspaceMiddleware(db db.DB) *WorkspaceMiddleware {
	return &WorkspaceMiddleware{
		db: db,
	}
}

func (m WorkspaceMiddleware) CheckWorkspaceExists() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) (returnErr error) {

			apiRoot := config.C.GetString(config.SERVER_API_ROOT_PATH)
			if c.Path() == apiRoot+"/workspaces" {
				return next(c)
			}

			workspaceId := c.Param("workspaceId")

			w, err := m.db.FindWorkspaceByID(workspaceId)

			if err != nil || w.ID == "" {
				return c.JSON(http.StatusBadRequest, "failed to get workspace by id")
			}

			return next(c)
		}
	}
}

func (m WorkspaceMiddleware) RestrictWorkspaceMember(config config.AppConfig) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) (returnErr error) {
			if c.Path() == config.Server.ApiRootPath+"/workspaces" {
				return next(c)
			}

			workspaceId := c.Param("workspaceId")

			users, err := m.db.FindWorkspaceUsers(model.WorkspaceUserFilter{WorkspaceID: workspaceId})

			if err != nil {
				return c.JSON(http.StatusBadRequest, "failed to get workspace by id")
			}

			isMember := false

			for _, u := range users {
				if u.UserID == c.Get("user").(model.User).ID {
					isMember = true
				}
			}

			if !isMember {
				return c.JSON(http.StatusForbidden, map[string]string{
					"error": "Restricted to workspace members only",
				})
			}

			return next(c)
		}
	}
}
