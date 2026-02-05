package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/collabreef/collabreef/internal/bootstrap"
	"github.com/collabreef/collabreef/internal/config"
	"github.com/collabreef/collabreef/internal/redis"
	"github.com/collabreef/collabreef/internal/server"
	"github.com/collabreef/collabreef/internal/websocket"
)

// Version is set at build time via ldflags
var Version = "dev"

func main() {
	log.Printf("Starting Collabreef Web Server version: %s", Version)

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
	noteCache := redis.NewNoteCache(redisClient)

	// Initialize WebSocket Hub
	hub := websocket.NewHub(db, viewCache, whiteboardCache, noteCache)
	log.Println("WebSocket Hub initialized")

	// Setup server with WebSocket support
	e, err := server.New(db, storage, hub, noteCache)
	if err != nil {
		log.Fatalf("Failed to setup server: %v", err)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Starting server on port %s", port)
		if err := e.Start(":" + port); err != nil {
			e.Logger.Fatal(err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Gracefully shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := e.Shutdown(ctx); err != nil {
		e.Logger.Fatal(err)
	}

	hub.Stop()
	log.Println("Server stopped")
}
