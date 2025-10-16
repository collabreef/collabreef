package sqlitedb

import (
	"context"

	"github.com/unsealdev/unseal/internal/model"
	"gorm.io/gorm"
)

func (s SqliteDB) CreateGenTemplate(g model.GenTemplate) error {
	return gorm.G[model.GenTemplate](s.getDB()).Create(context.Background(), &g)
}

func (s SqliteDB) UpdateGenTemplate(g model.GenTemplate) error {
	_, err := gorm.G[model.GenTemplate](s.getDB()).
		Where("id = ?", g.ID).
		Select("*").
		Updates(context.Background(), g)
	return err
}

func (s SqliteDB) DeleteGenTemplate(g model.GenTemplate) error {
	_, err := gorm.G[model.GenTemplate](s.getDB()).Where("id = ?", g.ID).Delete(context.Background())
	return err
}

func (s SqliteDB) FindGenTemplate(g model.GenTemplate) (model.GenTemplate, error) {
	template, err := gorm.
		G[model.GenTemplate](s.getDB()).
		Where("id = ?", g.ID).
		Take(context.Background())

	if err != nil {
		return model.GenTemplate{}, err
	}

	return template, nil
}

func (s SqliteDB) FindGenTemplates(f model.GenTemplateFilter) ([]model.GenTemplate, error) {
	var templates []model.GenTemplate

	db := s.getDB().Model(&model.GenTemplate{})

	if f.WorkspaceID != "" {
		db = db.Where("workspace_id = ?", f.WorkspaceID)
	}

	if f.Query != "" {
		searchQuery := "%" + f.Query + "%"
		db = db.Where("name LIKE ? OR prompt LIKE ?", searchQuery, searchQuery)
	}

	err := db.
		Order("created_at DESC").
		Offset((f.PageNumber - 1) * f.PageSize).
		Limit(f.PageSize).
		Find(&templates).Error

	return templates, err
}