package handler

import (
	"net/url"

	"github.com/collabreef/collabreef/internal/db"
	"github.com/collabreef/collabreef/internal/storage"
)

type Handler struct {
	db        db.DB
	storage   storage.Storage
	collabURL *url.URL
}

func NewHandler(r db.DB, s storage.Storage, collabURL *url.URL) *Handler {
	return &Handler{
		db:        r,
		storage:   s,
		collabURL: collabURL,
	}
}
