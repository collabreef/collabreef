package worker

import (
	"context"
	"log"
	"time"

	"github.com/collabreef/collabreef/internal/db"
	"github.com/collabreef/collabreef/internal/model"
	"github.com/collabreef/collabreef/internal/redis"
	"github.com/robfig/cron/v3"
)

// NotePersister handles periodic persistence of note data from Redis to database
type NotePersister struct {
	cache *redis.NoteCache
	db    db.DB
	cron  *cron.Cron
}

// NewNotePersister creates a new note persister
func NewNotePersister(cache *redis.NoteCache, database db.DB) *NotePersister {
	return &NotePersister{
		cache: cache,
		db:    database,
		cron:  cron.New(cron.WithSeconds()),
	}
}

// Start starts the persister with a schedule
func (p *NotePersister) Start() error {
	// Run every 30 seconds (seconds, minutes, hours, day of month, month, day of week)
	_, err := p.cron.AddFunc("*/30 * * * * *", func() {
		if err := p.PersistAll(); err != nil {
			log.Printf("Error persisting note data: %v", err)
		}
	})

	if err != nil {
		return err
	}

	p.cron.Start()
	log.Println("Note persister started, will run every 30 seconds")

	return nil
}

// Stop stops the persister
func (p *NotePersister) Stop() {
	ctx := p.cron.Stop()
	<-ctx.Done()
	log.Println("Note persister stopped")
}

// PersistAll persists all active notes from Redis to database
func (p *NotePersister) PersistAll() error {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	// Get all active note IDs
	noteIDs, err := p.cache.GetAllActiveNoteIDs(ctx)
	if err != nil {
		return err
	}

	if len(noteIDs) == 0 {
		log.Println("No active notes to persist")
		return nil
	}

	log.Printf("Persisting %d active notes to database", len(noteIDs))

	successCount := 0
	errorCount := 0

	for _, noteID := range noteIDs {
		if err := p.PersistNote(ctx, noteID); err != nil {
			log.Printf("Error persisting note %s: %v", noteID, err)
			errorCount++
		} else {
			successCount++
		}
	}

	log.Printf("Note persistence complete: %d succeeded, %d failed", successCount, errorCount)

	return nil
}

// PersistNote persists a single note's data to database
func (p *NotePersister) PersistNote(ctx context.Context, noteID string) error {
	// Get note data from Redis
	noteData, err := p.cache.GetNoteData(ctx, noteID)
	if err != nil {
		return err
	}

	// If note data is nil, skip persistence
	if noteData == nil {
		log.Printf("Note %s not found in cache, skipping persistence", noteID)
		return nil
	}

	// Find the note in database
	note, err := p.db.FindNote(model.Note{ID: noteID})
	if err != nil {
		return err
	}

	// Update only the fields from cache
	note.Title = noteData.Title
	note.Content = noteData.Content
	note.UpdatedAt = noteData.UpdatedAt
	note.UpdatedBy = noteData.UpdatedBy

	// Update note in database
	if err := p.db.UpdateNote(note); err != nil {
		return err
	}

	log.Printf("Persisted note %s (title: %s, content length: %d bytes)",
		noteID, noteData.Title, len(noteData.Content))

	return nil
}

// ForcePersist forces immediate persistence of all active notes
func (p *NotePersister) ForcePersist() error {
	return p.PersistAll()
}

// ForcePersistNote forces immediate persistence of a specific note
func (p *NotePersister) ForcePersistNote(noteID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	return p.PersistNote(ctx, noteID)
}
