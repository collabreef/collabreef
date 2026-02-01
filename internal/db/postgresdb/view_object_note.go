package postgresdb

import (
	"github.com/collabreef/collabreef/internal/model"
)

func (s PostgresDB) AddNoteToViewObject(v model.ViewObjectNote) error {
	return s.getDB().Exec(`
		INSERT INTO view_object_notes (view_object_id, note_id, created_at, created_by)
		VALUES ($1, $2, $3, $4)
	`, v.ViewObjectID, v.NoteID, v.CreatedAt, v.CreatedBy).Error
}

func (s PostgresDB) RemoveNoteFromViewObject(v model.ViewObjectNote) error {
	return s.getDB().Exec(`
		DELETE FROM view_object_notes
		WHERE view_object_id = $1 AND note_id = $2
	`, v.ViewObjectID, v.NoteID).Error
}

func (s PostgresDB) FindNotesForViewObject(viewObjectID string) ([]model.Note, error) {
	var notes []model.Note
	err := s.getDB().
		Table("notes").
		Joins("INNER JOIN view_object_notes ON notes.id = view_object_notes.note_id").
		Where("view_object_notes.view_object_id = ?", viewObjectID).
		Find(&notes).Error

	return notes, err
}

func (s PostgresDB) FindViewObjectsForNote(noteID string) ([]model.ViewObject, error) {
	var viewObjects []model.ViewObject
	err := s.getDB().
		Table("view_objects").
		Joins("INNER JOIN view_object_notes ON view_objects.id = view_object_notes.view_object_id").
		Where("view_object_notes.note_id = ?", noteID).
		Find(&viewObjects).Error

	return viewObjects, err
}
