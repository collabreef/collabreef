package model

// WidgetType defines the type of widget
type WidgetType string

const (
	WidgetTypeNoteForm   WidgetType = "note_form"   // Widget for creating/editing notes
	WidgetTypeNoteList   WidgetType = "note_list"   // Widget for displaying notes with conditions
	WidgetTypeNote       WidgetType = "note"        // Widget for displaying a single note's complete content
	WidgetTypeCountdown  WidgetType = "countdown"   // Widget for countdown timer
	WidgetTypeFileUpload WidgetType = "file_upload" // Widget for uploading files
	WidgetTypeCarousel   WidgetType = "carousel"    // Widget for image carousel
	WidgetTypeRSS        WidgetType = "rss"         // Widget for displaying RSS feeds
	WidgetTypeMusic      WidgetType = "music"       // Widget for playing audio files
	WidgetTypeVideo      WidgetType = "video"       // Widget for playing video files
	WidgetTypeIframe     WidgetType = "iframe"      // Widget for embedding external web pages
	WidgetTypeFolder     WidgetType = "folder"      // Widget for organizing widgets in a folder
	WidgetTypeLink       WidgetType = "link"        // Widget for displaying a clickable link
	WidgetTypeMap        WidgetType = "map"         // Widget for displaying a map view
	WidgetTypeCalendar   WidgetType = "calendar"    // Widget for displaying a calendar view
)

type WidgetFilter struct {
	WorkspaceID      string
	WidgetIDs        string
	Type             string
	ParentID         string // Filter by parent widget ID (empty string = root widgets, "*" = all widgets)
	PageSize         int
	PageNumber       int
	Query            string
}

type Widget struct {
	WorkspaceID string `json:"workspace_id"`
	ID          string `json:"id"`
	Type        string `json:"type"`     // Widget type (note_form, stats, template_form, view, note_list, note, folder)
	Config      string `json:"config"`   // JSON configuration for the widget
	Position    string `json:"position"` // JSON position data (x, y, width, height)
	ParentID    string `json:"parent_id"` // Parent widget ID for hierarchical structure (null for root widgets)
	CreatedAt   string `json:"created_at"`
	CreatedBy   string `json:"created_by"`
	UpdatedAt   string `json:"updated_at"`
	UpdatedBy   string `json:"updated_by"`
}