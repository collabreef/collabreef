package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/collabreef/collabreef/internal/bootstrap"
	"github.com/collabreef/collabreef/internal/config"
	"github.com/collabreef/collabreef/internal/redis"
	"github.com/collabreef/collabreef/internal/worker"
)

// Version is set at build time via ldflags
var Version = "dev"

func main() {
	log.Printf("Starting Collabreef Worker version: %s", Version)

	config.Init()

	db, err := bootstrap.NewDB()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Initialize Redis
	redisConfig := redis.Config{
		Addr:     config.C.GetString(config.REDIS_ADDR),
		Password: config.C.GetString(config.REDIS_PASSWORD),
		DB:       config.C.GetInt(config.REDIS_DB),
	}
	redisClient, err := redis.NewClient(redisConfig)
	if err != nil {
		log.Fatalf("Failed to initialize Redis: %v", err)
	}
	defer redisClient.Close()
	log.Printf("Redis connected: %s", redisConfig.Addr)

	// Initialize caches
	whiteboardCache := redis.NewWhiteboardCache(redisClient)
	noteCache := redis.NewNoteCache(redisClient)

	// Initialize and start whiteboard persister
	whiteboardPersister := worker.NewWhiteboardPersister(whiteboardCache, db)
	if err := whiteboardPersister.Start(); err != nil {
		log.Fatalf("Failed to start whiteboard persister: %v", err)
	}

	// Initialize and start note persister
	notePersister := worker.NewNotePersister(noteCache, db)
	if err := notePersister.Start(); err != nil {
		log.Fatalf("Failed to start note persister: %v", err)
	}
	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down worker...")

	// Force persist before shutdown
	if err := whiteboardPersister.ForcePersist(); err != nil {
		log.Printf("Error during final whiteboard persist: %v", err)
	}

	if err := notePersister.ForcePersist(); err != nil {
		log.Printf("Error during final note persist: %v", err)
	}

	whiteboardPersister.Stop()
	notePersister.Stop()
	log.Println("Worker stopped")
}
