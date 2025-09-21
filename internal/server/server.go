package server

import (
	"embed"
	"io/fs"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/pinbook/pinbook/internal/api/handler"
	"github.com/pinbook/pinbook/internal/api/middlewares"
	"github.com/pinbook/pinbook/internal/api/route"
	"github.com/pinbook/pinbook/internal/api/validate"
	"github.com/pinbook/pinbook/internal/config"
	"github.com/pinbook/pinbook/internal/db"
	"github.com/pinbook/pinbook/internal/storage"
)

//go:embed dist/*
var webAssets embed.FS

func New(db db.DB, storage storage.Storage) (*echo.Echo, error) {
	e := echo.New()

	subFS, err := fs.Sub(webAssets, "dist")
	if err != nil {
		return nil, err
	}

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
		Root:       ".",
		Index:      "index.html",
		Filesystem: http.FS(subFS),
		HTML5:      true,
	}))
	e.Validator = &validate.CustomValidator{Validator: validator.New()}

	apiRoot := config.C.GetString(config.SERVER_API_ROOT_PATH)

	// Routes
	api := e.Group(apiRoot)
	handler := handler.NewHandler(db, storage)
	auth := middlewares.NewAuthMiddleware(db)
	workspace := middlewares.NewWorkspaceMiddleware(db)

	route.RegisterAuth(api, *handler)
	route.RegisterAdmin(api, *handler, *auth)
	route.RegisterUser(api, *handler, *auth)
	route.RegisterWorkspace(api, *handler, *auth, *workspace)
	route.RegisterTool(api, *handler, *auth)
	route.RegisterPublic(api, *handler, *auth)

	return e, nil
}
