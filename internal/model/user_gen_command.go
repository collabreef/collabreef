package model

import "time"

type UserGenCommand struct {
	ID            string    `json:"id"`
	UserID        string    `json:"user_id"`
	Name          string    `json:"name"`
	ContainerType string    `json:"container_type"`
	Prompt        string    `json:"prompt"`
	GenType       string    `json:"gen_type"`
	Model         string    `json:"model"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// TableName specifies the table name for GORM
func (UserGenCommand) TableName() string {
	return "user_gencommands"
}
