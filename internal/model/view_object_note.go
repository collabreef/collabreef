package model

type ViewObjectNote struct {
	ViewObjectID string `json:"view_object_id"`
	NoteID       string `json:"note_id"`
	CreatedAt    string `json:"created_at"`
	CreatedBy    string `json:"created_by"`
}

type ViewObjectNoteFilter struct {
	ViewObjectID string
	NoteID       string
}