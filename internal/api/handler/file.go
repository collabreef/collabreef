package handler

import (
	"math/rand"
	"net/http"
	"path/filepath"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/pinbook/pinbook/internal/model"
	"github.com/pinbook/pinbook/internal/util"
)

func (h Handler) Upload(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	if workspaceId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Workspace id is required")
	}
	file, err := c.FormFile("file")
	if err != nil {
		return c.String(http.StatusBadRequest, "")
	}

	f, err := file.Open()
	if err != nil {
		return c.String(http.StatusInternalServerError, "")
	}
	defer f.Close()

	segments := []string{workspaceId}

	ext := filepath.Ext(file.Filename)
	randomStr := randStringRunes(4)
	newFileName := time.Now().Format("20060102150405") + "_" + randomStr + ext

	segments = append(segments, newFileName)

	err = h.storage.Save(segments, f)
	if err != nil {
		return c.String(http.StatusInternalServerError, "")
	}
	user := c.Get("user").(model.User)

	fileModel := model.File{
		WorkspaceID:      workspaceId,
		ID:               util.NewId(),
		Name:             newFileName,
		Ext:              ext,
		Size:             file.Size,
		OriginalFilename: file.Filename,
		CreatedAt:        time.Now(),
		CreatedBy:        user.ID,
	}
	if err := h.db.CreateFile(fileModel); err != nil {
		return c.String(http.StatusInternalServerError, "failed to save file record")
	}

	return c.JSON(http.StatusOK, echo.Map{
		"filename":      newFileName,
		"original_name": file.Filename,
		"size":          file.Size,
	})
}

func (h Handler) Download(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	filename := c.Param("id")
	if workspaceId == "" || filename == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Workspace id and filename are required")
	}

	segments := []string{workspaceId, filename}

	f, err := h.storage.Load(segments)

	if err != nil {
		return err
	}
	defer f.Close()

	return c.Stream(http.StatusOK, "application/octet-stream", f)
}

func (h Handler) Delete(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	id := c.Param("id")
	if workspaceId == "" || id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Workspace id and filename are required")
	}
	filter := model.FileFilter{
		WorkspaceID: workspaceId,
		ID:          id,
	}

	f, err := h.db.FindFileByID(id)

	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Failed to find file")
	}

	if err := h.db.DeleteFile(filter); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to delete file record")
	}

	segments := []string{workspaceId, f.Name}

	err = h.storage.Delete(segments)

	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to delete file")
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "File deleted"})
}

func (h Handler) List(c echo.Context) error {
	workspaceId := c.Param("workspaceId")
	if workspaceId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Workspace id is required")
	}
	filter := model.FileFilter{WorkspaceID: workspaceId}
	files, err := h.db.FindFiles(filter)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to list files")
	}
	fileInfos := make([]map[string]interface{}, 0, len(files))
	for _, f := range files {
		fileInfos = append(fileInfos, map[string]interface{}{
			"name":          f.Name,
			"original_name": f.OriginalFilename,
			"size":          f.Size,
			"ext":           f.Ext,
		})
	}
	return c.JSON(http.StatusOK, echo.Map{"files": fileInfos})
}

var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")

func randStringRunes(n int) string {
	b := make([]rune, n)
	for i := range b {
		b[i] = letterRunes[rand.Intn(len(letterRunes))]
	}
	return string(b)
}
