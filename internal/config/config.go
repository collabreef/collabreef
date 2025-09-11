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
	DB_DRIVER             = "db_driver"
	DB_DSN                = "db_dsn"
	DB_MIGRATIONS_PATH    = "db_migrations_path"
	STORAGE_TYPE          = "storage_type"
	STORAGE_ROOT          = "storage_root"
	SERVER_API_ROOT_PATH  = "server_api_root_path"
	SERVER_DISABLE_SIGNUP = "server_disable_signup"
)

func Init() {
	C = viper.New()

	C.SetDefault(DB_DRIVER, "sqlite3")
	C.SetDefault(DB_DSN, "bin/pinbook.db")
	C.SetDefault(DB_MIGRATIONS_PATH, "file://migrations/sqlite3")
	C.SetDefault(STORAGE_TYPE, "local")
	C.SetDefault(STORAGE_ROOT, "./bin/uploads/")
	C.SetDefault(SERVER_API_ROOT_PATH, "/api/v1")
	C.SetDefault(SERVER_DISABLE_SIGNUP, false)

	C.AutomaticEnv()
}
