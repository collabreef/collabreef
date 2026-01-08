package handler

import (
	"github.com/notepia/notepia/internal/db"
	"github.com/notepia/notepia/internal/storage"
	"github.com/notepia/notepia/internal/websocket"
)

type Handler struct {
	db      db.DB
	storage storage.Storage
	hub     *websocket.Hub
}

func NewHandler(r db.DB, s storage.Storage, hub *websocket.Hub) *Handler {
	return &Handler{
		db:      r,
		storage: s,
		hub:     hub,
	}
}
