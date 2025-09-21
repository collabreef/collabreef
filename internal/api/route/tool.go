package route

import (
	"github.com/pinbook/pinbook/internal/api/handler"
	"github.com/pinbook/pinbook/internal/api/middlewares"

	"github.com/labstack/echo/v4"
)

func RegisterTool(api *echo.Group, h handler.Handler, authMiddleware middlewares.AuthMiddleware) {
	g := api.Group("/tools")
	g.Use(authMiddleware.CheckJWT())
	g.Use(authMiddleware.ParseJWT())

	g.POST("/fetchfile", h.FetchFile)
}
