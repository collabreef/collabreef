package model

type ViewFilter struct {
	WorkspaceID string
	ViewIDs     []string
	ViewType    string
	PageSize    int
	PageNumber  int
}

type View struct {
	WorkspaceID     string `json:"workspace_id"`
	ID              string `json:"id"`
	Name            string `json:"name"`
	Type            string `json:"type"`
	Data            string `json:"data"`
	Visibility      string `json:"visibility"`
	YjsState        []byte `json:"yjs_state,omitempty"`
	YjsStateVector  []byte `json:"yjs_state_vector,omitempty"`
	CreatedAt       string `json:"created_at"`
	CreatedBy       string `json:"created_by"`
	UpdatedAt       string `json:"updated_at"`
	UpdatedBy       string `json:"updated_by"`
}
