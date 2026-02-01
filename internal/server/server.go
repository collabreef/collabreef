package server

import (
	"embed"
	"io/fs"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/collabreef/collabreef/internal/api/handler"
	"github.com/collabreef/collabreef/internal/api/middlewares"
	"github.com/collabreef/collabreef/internal/api/route"
	"github.com/collabreef/collabreef/internal/api/validate"
	"github.com/collabreef/collabreef/internal/config"
	"github.com/collabreef/collabreef/internal/db"
	"github.com/collabreef/collabreef/internal/redis"
	"github.com/collabreef/collabreef/internal/storage"
	"github.com/collabreef/collabreef/internal/websocket"
)

//go:embed dist/*
var webAssets embed.FS

func New(db db.DB, storage storage.Storage, hub *websocket.Hub, noteCache *redis.NoteCache) (*echo.Echo, error) {
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

	handler := handler.NewHandler(db, storage, hub, noteCache)
	auth := middlewares.NewAuthMiddleware(db)
	workspace := middlewares.NewWorkspaceMiddleware(db)

	// Register REST API routes under /api/v1
	api := e.Group(apiRoot)
	route.RegisterAuth(api, *handler)
	route.RegisterAdmin(api, *handler, *auth)
	route.RegisterUser(api, *handler, *auth)
	route.RegisterWorkspace(api, *handler, *auth, *workspace)
	route.RegisterTool(api, *handler, *auth)
	route.RegisterPublic(api, *handler, *auth)

	// Register WebSocket routes directly under /ws (not under /api/v1)
	route.RegisterWebSocket(e, *handler, *auth)

	return e, nil
}
