package model

type ViewObjectFilter struct {
	ViewID     string
	ObjectIDs  []string
	ObjectType string
	PageSize   int
	PageNumber int
}

type ViewObject struct {
	ID        string `json:"id"`
	ViewID    string `json:"view_id"`
	Name      string `json:"name"`
	Type      string `json:"type"`
	Data      string `json:"data"`
	CreatedAt string `json:"created_at"`
	CreatedBy string `json:"created_by"`
	UpdatedAt string `json:"updated_at"`
	UpdatedBy string `json:"updated_by"`
}