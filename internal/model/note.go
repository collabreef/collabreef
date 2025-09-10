package model

type NoteFilter struct {
	WorkspaceID string
	NoteIDs     string
	PageSize    int
	PageNumber  int
	Query       string
}

type Note struct {
	WorkspaceID string  `json:"workspace_id"`
	ID          string  `json:"id"`
	Blocks      []Block `json:"blocks"`
	Visibility  string  `json:"visibility"`
	CreatedAt   string  `json:"created_at"`
	CreatedBy   string  `json:"created_by"`
	UpdatedAt   string  `json:"updated_at"`
	UpdatedBy   string  `json:"updated_by"`
}
