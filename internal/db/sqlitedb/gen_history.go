package sqlitedb

import (
	"context"

	"github.com/unsealdev/unseal/internal/model"
	"gorm.io/gorm"
)

func (s SqliteDB) CreateGenHistory(h model.GenHistory) error {
	return gorm.G[model.GenHistory](s.getDB()).Create(context.Background(), &h)
}

func (s SqliteDB) DeleteGenHistory(h model.GenHistory) error {
	_, err := gorm.G[model.GenHistory](s.getDB()).Where("id = ?", h.ID).Delete(context.Background())
	return err
}

func (s SqliteDB) FindGenHistory(h model.GenHistory) (model.GenHistory, error) {
	history, err := gorm.
		G[model.GenHistory](s.getDB()).
		Where("id = ?", h.ID).
		Take(context.Background())

	if err != nil {
		return model.GenHistory{}, err
	}

	return history, nil
}

func (s SqliteDB) FindGenHistories(f model.GenHistoryFilter) ([]model.GenHistory, error) {
	var histories []model.GenHistory

	db := s.getDB().Model(&model.GenHistory{})

	if f.WorkspaceID != "" {
		db = db.Where("workspace_id = ?", f.WorkspaceID)
	}

	if f.TemplateID != "" {
		db = db.Where("template_id = ?", f.TemplateID)
	}

	err := db.
		Order("created_at DESC").
		Offset((f.PageNumber - 1) * f.PageSize).
		Limit(f.PageSize).
		Find(&histories).Error

	return histories, err
}
