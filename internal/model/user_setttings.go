package model

import "time"

type UserSettings struct {
	UserID    string    `gorm:"primaryKey;column:user_id" json:"user_id"`
	OpenAIKey *string   `gorm:"column:openai_api_key" json:"openai_api_key"`
	GeminiKey *string   `gorm:"column:gemini_api_key" json:"gemini_api_key"`
	OllamaKey *string   `gorm:"column:ollama_api_key" json:"ollama_api_key"`
	CreatedAt time.Time `json:"created_at"`
}
