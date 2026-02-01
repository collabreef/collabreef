package sqlitedb

import (
	"github.com/collabreef/collabreef/internal/model"
)

func (s SqliteDB) AddNoteToViewObject(v model.ViewObjectNote) error {
	return s.getDB().Exec(`
		INSERT INTO view_object_notes (view_object_id, note_id, created_at, created_by)
		VALUES (?, ?, ?, ?)
	`, v.ViewObjectID, v.NoteID, v.CreatedAt, v.CreatedBy).Error
}

func (s SqliteDB) RemoveNoteFromViewObject(v model.ViewObjectNote) error {
	return s.getDB().Exec(`
		DELETE FROM view_object_notes
		WHERE view_object_id = ? AND note_id = ?
	`, v.ViewObjectID, v.NoteID).Error
}

func (s SqliteDB) FindNotesForViewObject(viewObjectID string) ([]model.Note, error) {
	var notes []model.Note
	err := s.getDB().
		Table("notes").
		Joins("INNER JOIN view_object_notes ON notes.id = view_object_notes.note_id").
		Where("view_object_notes.view_object_id = ?", viewObjectID).
		Find(&notes).Error

	return notes, err
}

func (s SqliteDB) FindViewObjectsForNote(noteID string) ([]model.ViewObject, error) {
	var viewObjects []model.ViewObject
	err := s.getDB().
		Table("view_objects").
		Joins("INNER JOIN view_object_notes ON view_objects.id = view_object_notes.view_object_id").
		Where("view_object_notes.note_id = ?", noteID).
		Find(&viewObjects).Error

	return viewObjects, err
}