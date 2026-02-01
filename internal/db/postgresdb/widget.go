package postgresdb

import (
	"context"
	"strings"

	"github.com/collabreef/collabreef/internal/model"
	"gorm.io/gorm"
)

func (s PostgresDB) CreateWidget(w model.Widget) error {
	// PostgreSQL requires NULL instead of empty string for foreign key fields
	// Use raw SQL to handle NULLIF conversion for parent_id
	return s.getDB().Exec(`
		INSERT INTO widgets (workspace_id, id, type, config, position, parent_id, created_at, created_by, updated_at, updated_by)
		VALUES ($1, $2, $3, $4, $5, NULLIF($6, ''), $7, $8, $9, $10)
	`, w.WorkspaceID, w.ID, w.Type, w.Config, w.Position, w.ParentID, w.CreatedAt, w.CreatedBy, w.UpdatedAt, w.UpdatedBy).Error
}

func (s PostgresDB) UpdateWidget(w model.Widget) error {
	// PostgreSQL requires NULL instead of empty string for foreign key fields
	// Use raw SQL to handle NULLIF conversion for parent_id
	return s.getDB().Exec(`
		UPDATE widgets
		SET type = $1, config = $2, position = $3, parent_id = NULLIF($4, ''), updated_at = $5, updated_by = $6
		WHERE id = $7
	`, w.Type, w.Config, w.Position, w.ParentID, w.UpdatedAt, w.UpdatedBy, w.ID).Error
}

func (s PostgresDB) DeleteWidget(w model.Widget) error {
	_, err := gorm.G[model.Widget](s.getDB()).Where("id = ?", w.ID).Delete(context.Background())
	return err
}

func (s PostgresDB) FindWidget(w model.Widget) (model.Widget, error) {
	widget, err := gorm.
		G[model.Widget](s.getDB()).
		Where("id = ?", w.ID).
		Take(context.Background())

	return widget, err
}

func (s PostgresDB) FindWidgets(f model.WidgetFilter) ([]model.Widget, error) {
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
