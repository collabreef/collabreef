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
	YjsState  []byte `json:"yjs_state,omitempty"`
	CreatedAt string `json:"created_at"`
	CreatedBy string `json:"created_by"`
	UpdatedAt string `json:"updated_at"`
	UpdatedBy string `json:"updated_by"`
}

// CalendarSlotData represents the data structure for calendar slots stored in the Data field
type CalendarSlotData struct {
	Date      string  `json:"date"`       // YYYY-MM-DD format
	StartTime *string `json:"start_time"` // HH:MM format (optional)
	EndTime   *string `json:"end_time"`   // HH:MM format (optional)
	IsAllDay  bool    `json:"is_all_day"` // true for all-day events
}