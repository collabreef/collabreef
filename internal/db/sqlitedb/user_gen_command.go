package sqlitedb

import (
	"context"

	"github.com/unsealdev/unseal/internal/model"
	"gorm.io/gorm"
)

func (s SqliteDB) CreateUserGenCommand(c model.UserGenCommand) error {
	return gorm.G[model.UserGenCommand](s.getDB()).Create(context.Background(), &c)
}
func (s SqliteDB) UpdateUserGenCommand(c model.UserGenCommand) error {
	_, err := gorm.G[model.UserGenCommand](s.getDB()).Where("id = ?", c.ID).Updates(context.Background(), c)

	return err
}
func (s SqliteDB) DeleteUserGenCommand(id string) error {
	_, err := gorm.G[model.UserGenCommand](s.getDB()).Where("id = ?", id).Delete(context.Background())

	return err
}
func (s SqliteDB) FindUserGenCommandsByUserID(id string) ([]model.UserGenCommand, error) {
	query := gorm.
		G[model.UserGenCommand](s.getDB())

	commands, err := query.
		Where("user_id = ?", id).
		Find(context.Background())

	return commands, err
}
