package bootstrap

import (
	"fmt"

	"github.com/collabreef/collabreef/internal/config"
	"github.com/collabreef/collabreef/internal/db"
	"github.com/collabreef/collabreef/internal/db/postgresdb"
	"github.com/collabreef/collabreef/internal/db/sqlitedb"
)

func NewDB() (db.DB, error) {
	driver := config.C.GetString(config.DB_DRIVER)
	switch driver {
	case "sqlite3":
		return sqlitedb.NewSqliteDB()
	case "postgres":
		return postgresdb.NewPostgresDB()
	}

	return nil, fmt.Errorf("unsupported database driver: %s", driver)
}
