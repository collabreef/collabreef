package handler

import (
	"github.com/unsealdev/unseal/internal/ai/gen"
	"github.com/unsealdev/unseal/internal/db"
	"github.com/unsealdev/unseal/internal/storage"
)

type Handler struct {
	db         db.DB
	storage    storage.Storage
	genService *gen.Service
}

func NewHandler(r db.DB, s storage.Storage, genService *gen.Service) *Handler {
	return &Handler{
		db:         r,
		storage:    s,
		genService: genService,
	}
}
