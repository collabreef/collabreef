package sqlitedb

import (
	"context"
	"strings"

	"github.com/unsealdev/unseal/internal/model"
	"gorm.io/gorm"
)

func (s SqliteDB) CreateNote(n model.Note) error {
	return gorm.G[model.Note](s.getDB()).Create(context.Background(), &n)
}

func (s SqliteDB) UpdateNote(n model.Note) error {
	_, err := gorm.G[model.Note](s.getDB()).
		Where("id = ?", n.ID).
		Select("title", "content", "visibility", "updated_at", "updated_by").
		Updates(context.Background(), n)
	return err
}

func (s SqliteDB) DeleteNote(n model.Note) error {
	_, err := gorm.G[model.Note](s.getDB()).Where("id = ?", n.ID).Delete(context.Background())
	return err
}

func (s SqliteDB) FindNote(n model.Note) (model.Note, error) {
	note, err := gorm.
		G[model.Note](s.getDB()).
		Where("id = ?", n.ID).
		Take(context.Background())

	return note, err
}

func (s SqliteDB) FindNotes(f model.NoteFilter) ([]model.Note, error) {
	var notes []model.Note

	var conds []string
	var args []interface{}

	if f.WorkspaceID != "" {
		conds = append(conds, "workspace_id = ?")
		args = append(args, f.WorkspaceID)
	}

	if f.Query != "" {
		query := "%" + f.Query + "%"
		conds = append(conds, "(title LIKE ? OR content LIKE ?)")
		args = append(args, query, query)
	}

	query := s.getDB().Model(&model.Note{})

	if len(conds) > 0 {
		query = query.Where(strings.Join(conds, " AND "), args...)
	}

	err := query.
		Order("created_at DESC").
		Offset((f.PageNumber - 1) * f.PageSize).
		Limit(f.PageSize).
		Find(&notes).Error

	return notes, err
}
