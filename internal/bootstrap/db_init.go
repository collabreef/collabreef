package bootstrap

import (
	"fmt"

	"github.com/notepia/notepia/internal/config"
	"github.com/notepia/notepia/internal/db"
	"github.com/notepia/notepia/internal/db/sqlitedb"
)

func NewDB() (db.DB, error) {
	driver := config.C.GetString(config.DB_DRIVER)
	switch driver {
	case "sqlite3":
		return sqlitedb.NewSqliteDB()
	}

	return nil, fmt.Errorf("unsupported database driver: %s", driver)
}
