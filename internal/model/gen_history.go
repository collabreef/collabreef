package model

type GenHistoryFilter struct {
	WorkspaceID string
	TemplateID  string
	PageSize    int
	PageNumber  int
}

type GenHistory struct {
	ID               string `json:"id"`
	WorkspaceID      string `json:"workspace_id"`
	TemplateID       string `json:"template_id"`
	RequestPrompt    string `json:"request_prompt"`
	RequestModel     string `json:"request_model"`
	RequestModality  string `json:"request_modality"`
	RequestImageURLs string `json:"request_image_urls"` // Comma-separated image URLs
	ResponseContent  string `json:"response_content"`
	ResponseError    string `json:"response_error"`
	CreatedAt        string `json:"created_at"`
	CreatedBy        string `json:"created_by"`
}
