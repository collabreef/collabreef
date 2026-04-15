package model

type NoteFilter struct {
	WorkspaceID string
	NoteIDs     string
	PageSize    int
	PageNumber  int
	UserID      string
	Query       string
	SortBy      string // "updated_at" or "created_at" (default)
	ParentID    string // filter by parent note id; use "null" to get root notes
}

type Note struct {
	WorkspaceID string `json:"workspace_id"`
	ID          string `json:"id"`
	ParentID    string `json:"parent_id"`
	Title       string `json:"title"`
	Content     string `json:"content"`
	Visibility  string `json:"visibility"`
	CreatedAt   string `json:"created_at"`
	CreatedBy   string `json:"created_by"`
	UpdatedAt   string `json:"updated_at"`
	UpdatedBy   string `json:"updated_by"`
}
