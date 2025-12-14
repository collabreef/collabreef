package middlewares

import (
	"net/http"

	"github.com/notepia/notepia/internal/api/auth"
	"github.com/notepia/notepia/internal/db"

	"github.com/labstack/echo/v4"
)

type AuthMiddleware struct {
	db db.DB
}

func NewAuthMiddleware(db db.DB) *AuthMiddleware {
	return &AuthMiddleware{
		db: db,
	}
}

func (a AuthMiddleware) ParseJWT() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) (returnErr error) {
			cookie, err := c.Cookie("token")
			if err != nil || cookie.Value == "" {
				return next(c)
			}

			user, err := auth.GetUserFromCookie(cookie)
			if err != nil || user == nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
			}

			c.Set("user", *user)

			return next(c)
		}
	}
}

func (a AuthMiddleware) CheckJWT() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) (returnErr error) {
			cookie, err := c.Cookie("token")
			if err != nil || cookie.Value == "" {
				return echo.NewHTTPError(http.StatusUnauthorized, "missing or invalid token")
			}
			return next(c)
		}
	}
}

func (a AuthMiddleware) RequireOwnerOrAdmin() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) (returnErr error) {
			role := c.Get("role").(string)

			if role == "" {
				return c.JSON(http.StatusUnauthorized, "please login")
			}
			if role != "owner" && role != "admin" {
				return c.JSON(http.StatusForbidden, "insufficient permissions")
			}

			return next(c)
		}
	}
}
