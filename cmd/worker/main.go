package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/notepia/notepia/internal/bootstrap"
	"github.com/notepia/notepia/internal/config"
	"github.com/notepia/notepia/internal/redis"
	"github.com/notepia/notepia/internal/worker"
)

// Version is set at build time via ldflags
var Version = "dev"

func main() {
	log.Printf("Starting Notepia Worker version: %s", Version)

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
	viewCache := redis.NewViewCache(redisClient)
	whiteboardCache := redis.NewWhiteboardCache(redisClient)

	// Initialize and start Y.js persister (for non-whiteboard views)
	yjsPersister := worker.NewPersister(viewCache, db)
	if err := yjsPersister.Start(); err != nil {
		log.Fatalf("Failed to start Y.js persister: %v", err)
	}
	log.Println("Y.js persister started, will persist data every 5 minutes")

	// Initialize and start whiteboard persister
	whiteboardPersister := worker.NewWhiteboardPersister(whiteboardCache, db)
	if err := whiteboardPersister.Start(); err != nil {
		log.Fatalf("Failed to start whiteboard persister: %v", err)
	}
	log.Println("Whiteboard persister started, will persist data every 5 minutes")

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down worker...")

	// Force persist before shutdown
	if err := yjsPersister.ForcePersist(); err != nil {
		log.Printf("Error during final Y.js persist: %v", err)
	}
	if err := whiteboardPersister.ForcePersist(); err != nil {
		log.Printf("Error during final whiteboard persist: %v", err)
	}

	yjsPersister.Stop()
	whiteboardPersister.Stop()
	log.Println("Worker stopped")
}
