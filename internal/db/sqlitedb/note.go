package sqlitedb

import (
	"context"
	"strings"

	"github.com/pinbook/pinbook/internal/model"
	"gorm.io/gorm"
)

func (s SqliteDB) CreateNote(n model.Note) error {
	return gorm.G[model.Note](s.getDB()).Create(context.Background(), &n)
}

func (s SqliteDB) UpdateNote(n model.Note) error {
	db := s.getDB().Begin()
	defer func() {
		if r := recover(); r != nil {
			db.Rollback()
			panic(r)
		}
	}()

	_, err := gorm.G[model.Block](db).Where("note_id = ?", n.ID).Delete(context.Background())

	if err != nil {
		s.Rollback()
		return err
	}

	result := db.Create(n.Blocks)

	if result.Error != nil {
		db.Rollback()
		return result.Error
	}

	db.Commit()

	return nil
}

func (s SqliteDB) DeleteNote(n model.Note) error {
	db := s.getDB().Begin()
	defer func() {
		if r := recover(); r != nil {
			db.Rollback()
			panic(r)
		}
	}()

	_, err := gorm.G[model.Block](db).Where("note_id = ?", n.ID).Delete(context.Background())

	if err != nil {
		s.Rollback()
		return err
	}

	_, err = gorm.G[model.Note](db).Where("id = ?", n.ID).Delete(context.Background())

	if err != nil {
		db.Rollback()
		return err
	}
	db.Commit()

	return nil
}

func (s SqliteDB) FindNote(n model.Note) (model.Note, error) {
	note, err := gorm.
		G[model.Note](s.getDB()).
		Where("id = ?", n.ID).
		Take(context.Background())

	if err != nil {
		return model.Note{}, err
	}
	query := gorm.
		G[model.Block](s.getDB())

	blocks, err := query.
		Where("note_id = ?", n.ID).
		Find(context.Background())

	if err != nil {
		return model.Note{}, err
	}

	note.Blocks = blocks

	return note, err
}

func (s SqliteDB) FindNotes(f model.NoteFilter) ([]model.Note, error) {
	var notes []model.Note

	var conds []string
	var args []interface{}

	if f.WorkspaceID != "" {
		conds = append(conds, "notes.workspace_id = ? AND blocks.workspace_id = ?")
		args = append(args, f.WorkspaceID, f.WorkspaceID)
	}

	if f.Query != "" {
		query := "%" + f.Query + "%"
		conds = append(conds, `(
		(blocks.type IN ('paragraph','header','quote') AND json_extract(blocks.data,'$.text') LIKE ?) 
		OR (blocks.type='code' AND json_extract(blocks.data,'$.code') LIKE ?)
		OR (blocks.type='list' AND EXISTS (
			SELECT 1 FROM json_each(json_extract(blocks.data,'$.items'))
			WHERE json_extract(value,'$.content') LIKE ?
		))
	)`)
		args = append(args, query, query, query)
	}

	err := s.getDB().Model(&model.Note{}).
		Select("DISTINCT notes.*").
		Joins("JOIN blocks ON blocks.note_id = notes.id").
		Where(strings.Join(conds, " AND "), args...).
		Preload("Blocks").
		Order("notes.created_at DESC").
		Offset((f.PageNumber - 1) * f.PageSize).
		Limit(f.PageSize).
		Find(&notes).Error

	return notes, err
}
