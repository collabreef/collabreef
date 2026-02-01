package route

import (
	"github.com/collabreef/collabreef/internal/api/handler"
	"github.com/collabreef/collabreef/internal/api/middlewares"

	"github.com/labstack/echo/v4"
)

func RegisterTool(api *echo.Group, h handler.Handler, authMiddleware middlewares.AuthMiddleware) {
	g := api.Group("/tools")
	g.Use(authMiddleware.CheckJWT())
	g.Use(authMiddleware.ParseJWT())

	g.POST("/fetchfile", h.FetchFile)
	g.GET("/fetch-rss", h.FetchRSS)
}
