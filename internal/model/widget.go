package model

// WidgetType defines the type of widget
type WidgetType string

const (
	WidgetTypeNoteForm     WidgetType = "note_form"     // Widget for creating/editing notes
	WidgetTypeStats        WidgetType = "stats"         // Widget for displaying statistics
	WidgetTypeTemplateForm WidgetType = "template_form" // Widget for generating content from templates
	WidgetTypeView         WidgetType = "view"          // Widget for displaying a view
	WidgetTypeNoteList     WidgetType = "note_list"     // Widget for displaying notes with conditions
	WidgetTypeNote         WidgetType = "note"          // Widget for displaying a single note's complete content
	WidgetTypeCountdown    WidgetType = "countdown"     // Widget for countdown timer
	WidgetTypeFileUpload   WidgetType = "file_upload"   // Widget for uploading files
)

type WidgetFilter struct {
	WorkspaceID string
	WidgetIDs   string
	Type        string
	PageSize    int
	PageNumber  int
	Query       string
}

type Widget struct {
	WorkspaceID string `json:"workspace_id"`
	ID          string `json:"id"`
	Type        string `json:"type"`     // Widget type (note_form, stats, template_form, view, note_list, note)
	Config      string `json:"config"`   // JSON configuration for the widget
	Position    string `json:"position"` // JSON position data (x, y, width, height)
	CreatedAt   string `json:"created_at"`
	CreatedBy   string `json:"created_by"`
	UpdatedAt   string `json:"updated_at"`
	UpdatedBy   string `json:"updated_by"`
}