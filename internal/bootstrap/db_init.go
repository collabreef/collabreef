package bootstrap

import (
	"fmt"

	"github.com/pinbook/pinbook/internal/config"
	"github.com/pinbook/pinbook/internal/db"
	"github.com/pinbook/pinbook/internal/db/sqlitedb"
)

func NewDB() (db.DB, error) {
	driver := config.C.GetString(config.DB_DRIVER)
	switch driver {
	case "sqlite3":
		return sqlitedb.NewSqliteDB()
	}

	return nil, fmt.Errorf("unsupported database driver: %s", driver)
}
