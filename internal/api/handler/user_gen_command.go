package handler

import (
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/unsealdev/unseal/internal/model"
	"github.com/unsealdev/unseal/internal/util"
)

type CreateOrUpdateUserGenCommandRequest struct {
	Name          string `json:"name" validate:"required"`
	ContainerType string `json:"container_type" validate:"required"`
	Prompt        string `json:"prompt" validate:"required"`
	GenType       string `json:"gen_type" validate:"required,oneof=text-to-text text-to-image text-and-image-to-text text-and-image-to-image"`
	Model         string `json:"model" validate:"required"`
}

func (h Handler) GetUserGenCommands(c echo.Context) error {
	userID := c.Param("userid")

	user := c.Get("user").(model.User)

	if user.ID != userID {
		return echo.NewHTTPError(http.StatusForbidden, "You do not have permission to get user gen commands")
	}

	commands, err := h.db.FindUserGenCommandsByUserID(userID)

	if err != nil {
		log.Println("Error occurred:", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get user gen commands")
	}

	return c.JSON(http.StatusOK, commands)
}

func (h Handler) CreateUserGenCommand(c echo.Context) error {
	userID := c.Param("userid")

	user := c.Get("user").(model.User)

	if user.ID != userID {
		return echo.NewHTTPError(http.StatusForbidden, "You do not have permission to create user gen command")
	}

	var req CreateOrUpdateUserGenCommandRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	command := model.UserGenCommand{
		ID:            util.NewId(),
		UserID:        userID,
		Name:          req.Name,
		ContainerType: req.ContainerType,
		GenType:       req.GenType,
		Model:         req.Model,
		Prompt:        req.Prompt,
	}

	err := h.db.CreateUserGenCommand(command)

	if err != nil {
		log.Println("Error occurred:", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create user gen command")
	}

	return c.JSON(http.StatusOK, command)
}

func (h Handler) UpdateUserGenCommand(c echo.Context) error {
	userID := c.Param("userid")

	user := c.Get("user").(model.User)

	if user.ID != userID {
		return echo.NewHTTPError(http.StatusForbidden, "You do not have permission to update user gen command")
	}

	id := c.Param("id")

	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "id is required")
	}

	var req CreateOrUpdateUserGenCommandRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	command := model.UserGenCommand{
		ID:            id,
		Name:          req.Name,
		ContainerType: req.ContainerType,
		GenType:       req.GenType,
		Model:         req.Model,
		Prompt:        req.Prompt,
	}

	err := h.db.UpdateUserGenCommand(command)

	if err != nil {
		log.Println("Error occurred:", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to update user gen command")
	}

	return c.JSON(http.StatusOK, command)
}

func (h Handler) DeleteUserGenCommand(c echo.Context) error {
	userID := c.Param("userid")

	user := c.Get("user").(model.User)

	if user.ID != userID {
		return echo.NewHTTPError(http.StatusForbidden, "You do not have permission to delete user gen command")
	}

	id := c.Param("id")

	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "id is required")
	}

	err := h.db.DeleteUserGenCommand(id)

	if err != nil {
		log.Println("Error occurred:", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to update user gen command")
	}

	return c.JSON(http.StatusOK, nil)
}
