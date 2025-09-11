package config

import "github.com/spf13/viper"

type DatabaseConfig struct {
	Driver        string
	DSN           string
	MaxIdle       int
	MaxOpen       int
	MigrationPath string
}

type StorageConfig struct {
	Type string
	Root string
}

type ServerConfig struct {
	ApiRootPath string
	Port        string
	Timeout     int
}

type AppConfig struct {
	DB      DatabaseConfig
	Storage StorageConfig
	Server  ServerConfig
}

var C *viper.Viper

const (
	DB_DRIVER            = "DB_DRIVER"
	DB_DSN               = "DB_DRIVER"
	DB_MIGRATIONS_PATH   = "DB_DRIVER"
	STORAGE_TYPE         = "DB_DRIVER"
	STORAGE_ROOT         = "DB_DRIVER"
	SERVER_API_ROOT_PATH = "DB_DRIVER"
)

func Init() {
	viper.SetDefault("DB_DRIVER", "sqlite3")
	viper.SetDefault("DB_DSN", "bin/pinbook.db")
	viper.SetDefault("DB_MIGRATIONS_PATH", "file://migrations/sqlite3")
	viper.SetDefault("STORAGE_TYPE", "local")
	viper.SetDefault("STORAGE_ROOT", "./bin/uploads/")
	viper.SetDefault("SERVER_API_ROOT_PATH", "/api/v1")

	viper.AutomaticEnv()
}
