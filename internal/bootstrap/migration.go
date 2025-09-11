package bootstrap

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/pinbook/pinbook/internal/config"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func RunMigration() error {
	driver := config.C.GetString(config.DB_DRIVER)

	switch driver {
	case "sqlite3":
		return runSqlite3Migrations()
	}

	return fmt.Errorf("unsupported database driver: %s", driver)
}

func runSqlite3Migrations() error {
	db, err := sql.Open(config.C.GetString(config.DB_DRIVER), config.C.GetString(config.DB_DSN))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	driver, err := sqlite3.WithInstance(db, &sqlite3.Config{})
	if err != nil {
		log.Fatal(err)
	}

	migrateInstance, err := migrate.NewWithDatabaseInstance(
		config.C.GetString(config.DB_MIGRATIONS_PATH),
		"main",
		driver,
	)

	if err != nil {
		return fmt.Errorf("Error creating migration instance: %w", err)
	}

	if err := migrateInstance.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("Error applying migrations: %w", err)
	}

	fmt.Println("Migrations applied successfully!")
	return nil
}
