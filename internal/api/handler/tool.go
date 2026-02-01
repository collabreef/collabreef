package handler

import (
	"bytes"
	"io"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/collabreef/collabreef/internal/rssfetcher"
	"github.com/collabreef/collabreef/internal/urlfetcher"
)

type FetchFileRequest struct {
	Url string `json:"url"`
}

func (h Handler) FetchFile(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	if workspaceId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Workspace id is required")
	}
	req := new(FetchFileRequest)
	if err := c.Bind(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	if req.Url == "" {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"success": 0,
			"message": "No URL provided",
		})
	}

	data, contentType, err := urlfetcher.SafeFetchFile(c.Request().Context(), req.Url)

	if err != nil {
		return err
	}

	c.Response().Header().Set(echo.HeaderContentType, contentType)

	c.Response().WriteHeader(http.StatusOK)
	_, copyErr := io.Copy(c.Response().Writer, bytes.NewReader(data))

	return copyErr
}

type FetchRSSRequest struct {
	Url string `json:"url"`
}

func (h Handler) FetchRSS(c echo.Context) error {
	feedURL := c.QueryParam("url")
	if feedURL == "" {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": "Feed URL is required",
		})
	}

	feed, err := rssfetcher.FetchAndParseFeed(c.Request().Context(), feedURL)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": "Failed to fetch RSS feed: " + err.Error(),
		})
	}

	return c.JSON(http.StatusOK, feed)
}
