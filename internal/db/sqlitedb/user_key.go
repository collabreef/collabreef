package sqlitedb

import "github.com/pinbook/pinbook/internal/model"

func (db SqliteDB) SaveUserKey(u model.UserKey) error {

	return nil
}

func (db SqliteDB) GetUserKey(u model.UserKey) (model.UserKey, error) {

	return model.UserKey{}, nil
}
