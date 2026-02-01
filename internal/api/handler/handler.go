package handler

import (
	"github.com/collabreef/collabreef/internal/db"
	"github.com/collabreef/collabreef/internal/redis"
	"github.com/collabreef/collabreef/internal/storage"
	"github.com/collabreef/collabreef/internal/websocket"
)

type Handler struct {
	db        db.DB
	storage   storage.Storage
	hub       *websocket.Hub
	noteCache *redis.NoteCache
}

func NewHandler(r db.DB, s storage.Storage, hub *websocket.Hub, noteCache *redis.NoteCache) *Handler {
	return &Handler{
		db:        r,
		storage:   s,
		hub:       hub,
		noteCache: noteCache,
	}
}
