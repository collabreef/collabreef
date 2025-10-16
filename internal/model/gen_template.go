package model

type GenTemplateFilter struct {
	WorkspaceID string
	PageSize    int
	PageNumber  int
	Query       string
}

type GenTemplate struct {
	WorkspaceID string `json:"workspace_id"`
	ID          string `json:"id"`
	Name        string `json:"name"`
	Prompt      string `json:"prompt"`
	Model       string `json:"model"`
	Modality    string `json:"modality"`
	ImageURLs   string `json:"image_urls"` // Comma-separated image URLs for template default images
	CreatedAt   string `json:"created_at"`
	CreatedBy   string `json:"created_by"`
	UpdatedAt   string `json:"updated_at"`
	UpdatedBy   string `json:"updated_by"`
}