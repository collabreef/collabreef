package server

import (
	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/collabreef/collabreef/internal/api/handler"
	"github.com/collabreef/collabreef/internal/api/middlewares"
	"github.com/collabreef/collabreef/internal/api/route"
	"github.com/collabreef/collabreef/internal/api/validate"
	"github.com/collabreef/collabreef/internal/config"
	"github.com/collabreef/collabreef/internal/db"
	"github.com/collabreef/collabreef/internal/storage"
)

func New(db db.DB, storage storage.Storage) (*echo.Echo, error) {
	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Validator = &validate.CustomValidator{Validator: validator.New()}

	apiRoot := config.C.GetString(config.SERVER_API_ROOT_PATH)

	handler := handler.NewHandler(db, storage)
	auth := middlewares.NewAuthMiddleware(db)
	workspace := middlewares.NewWorkspaceMiddleware(db)

	// Register REST API routes under /api/v1
	api := e.Group(apiRoot)
	route.RegisterAuth(api, *handler)
	route.RegisterAdmin(api, *handler, *auth)
	route.RegisterUser(api, *handler, *auth)
	route.RegisterWorkspace(api, *handler, *auth, *workspace)
	route.RegisterTool(api, *handler, *auth)

	return e, nil
}
