package sqlitedb

import (
	"context"
	"strings"

	"github.com/collabreef/collabreef/internal/model"
	"gorm.io/gorm"
)

func (s SqliteDB) CreateWidget(w model.Widget) error {
	return gorm.G[model.Widget](s.getDB()).Create(context.Background(), &w)
}

func (s SqliteDB) UpdateWidget(w model.Widget) error {
	_, err := gorm.G[model.Widget](s.getDB()).
		Where("id = ?", w.ID).
		Select("type", "config", "position", "parent_id", "updated_at", "updated_by").
		Updates(context.Background(), w)
	return err
}

func (s SqliteDB) DeleteWidget(w model.Widget) error {
	_, err := gorm.G[model.Widget](s.getDB()).Where("id = ?", w.ID).Delete(context.Background())
	return err
}

func (s SqliteDB) FindWidget(w model.Widget) (model.Widget, error) {
	widget, err := gorm.
		G[model.Widget](s.getDB()).
		Where("id = ?", w.ID).
		Take(context.Background())

	return widget, err
}

func (s SqliteDB) FindWidgets(f model.WidgetFilter) ([]model.Widget, error) {
	var widgets []model.Widget

	var conds []string
	var args []interface{}

	if f.WorkspaceID != "" {
		conds = append(conds, "workspace_id = ?")
		args = append(args, f.WorkspaceID)
	}

	if f.Type != "" {
		conds = append(conds, "type = ?")
		args = append(args, f.Type)
	}

	// Handle parent_id filtering
	// Empty string = root widgets (parent_id IS NULL or parent_id = '')
	// "*" = all widgets (no parent_id filter)
	// Any other value = widgets with that specific parent_id
	if f.ParentID != "*" {
		if f.ParentID == "" {
			conds = append(conds, "(parent_id IS NULL OR parent_id = '')")
		} else {
			conds = append(conds, "parent_id = ?")
			args = append(args, f.ParentID)
		}
	}

	query := s.getDB().Model(&model.Widget{})

	if len(conds) > 0 {
		query = query.Where(strings.Join(conds, " AND "), args...)
	}

	err := query.
		Order("created_at DESC").
		Offset((f.PageNumber - 1) * f.PageSize).
		Limit(f.PageSize).
		Find(&widgets).Error

	return widgets, err
}