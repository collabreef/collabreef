package main

import (
	"log"
	"os"

	"github.com/notepia/notepia/internal/bootstrap"
	"github.com/notepia/notepia/internal/config"
	"github.com/notepia/notepia/internal/server"
)

// Version is set at build time via ldflags
var Version = "dev"

func main() {
	log.Printf("Starting Notepia version: %s", Version)

	config.Init()

	if err := bootstrap.RunMigration(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	db, err := bootstrap.NewDB()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	storage, err := bootstrap.NewStorage()
	if err != nil {
		log.Fatalf("Failed to initialize storage: %v", err)
	}

	e, err := server.New(db, storage)
	if err != nil {
		log.Fatalf("Failed to setup server: %v", err)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	if err := e.Start(":" + port); err != nil {
		e.Logger.Fatal(err)
	}
}
