package model

type UserSettings struct {
	UserID    string  `gorm:"primaryKey"`
	OpenAIKey *string `gorm:"column:openai_api_key"`
	GeminiKey *string `gorm:"column:gemini_api_key"`
	CreatedAt int64
}
