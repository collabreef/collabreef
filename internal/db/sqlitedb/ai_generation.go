package sqlitedb

import (
	"context"

	"github.com/unsealdev/unseal/internal/model"
	"gorm.io/gorm"
)

func (s SqliteDB) CreateAIGeneration(g model.AIGeneration) error {
	return gorm.G[model.AIGeneration](s.getDB()).Create(context.Background(), &g)
}

func (s SqliteDB) FindAIGenerationByID(id string) (model.AIGeneration, error) {
	gen, err := gorm.G[model.AIGeneration](s.getDB()).
		Where("id = ?", id).
		First(context.Background())

	return gen, err
}

func (s SqliteDB) FindAIGenerationsByUserID(userID string, limit int) ([]model.AIGeneration, error) {
	query := gorm.G[model.AIGeneration](s.getDB()).
		Where("user_id = ?", userID).
		Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	generations, err := query.Find(context.Background())

	return generations, err
}