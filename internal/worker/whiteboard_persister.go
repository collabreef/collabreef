package worker

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/notepia/notepia/internal/db"
	"github.com/notepia/notepia/internal/model"
	"github.com/notepia/notepia/internal/redis"
	"github.com/robfig/cron/v3"
)

// WhiteboardPersister handles periodic persistence of whiteboard data from Redis to database
type WhiteboardPersister struct {
	cache *redis.WhiteboardCache
	db    db.DB
	cron  *cron.Cron
}

// NewWhiteboardPersister creates a new whiteboard persister
func NewWhiteboardPersister(cache *redis.WhiteboardCache, database db.DB) *WhiteboardPersister {
	return &WhiteboardPersister{
		cache: cache,
		db:    database,
		cron:  cron.New(cron.WithSeconds()),
	}
}

// Start starts the persister with a schedule
func (p *WhiteboardPersister) Start() error {
	// Run every 30 seconds (seconds, minutes, hours, day of month, month, day of week)
	_, err := p.cron.AddFunc("*/30 * * * * *", func() {
		if err := p.PersistAll(); err != nil {
			log.Printf("Error persisting whiteboard data: %v", err)
		}
	})

	if err != nil {
		return err
	}

	p.cron.Start()
	log.Println("Whiteboard persister started, will run every 30 seconds")

	return nil
}

// Stop stops the persister
func (p *WhiteboardPersister) Stop() {
	ctx := p.cron.Stop()
	<-ctx.Done()
	log.Println("Whiteboard persister stopped")
}

// PersistAll persists all active whiteboards from Redis to database
func (p *WhiteboardPersister) PersistAll() error {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	// Get all active whiteboard IDs
	viewIDs, err := p.cache.GetAllActiveWhiteboardIDs(ctx)
	if err != nil {
		return err
	}

	if len(viewIDs) == 0 {
		log.Println("No active whiteboards to persist")
		return nil
	}

	log.Printf("Persisting %d active whiteboards to database", len(viewIDs))

	successCount := 0
	errorCount := 0

	for _, viewID := range viewIDs {
		if err := p.PersistWhiteboard(ctx, viewID); err != nil {
			log.Printf("Error persisting whiteboard %s: %v", viewID, err)
			errorCount++
		} else {
			successCount++
		}
	}

	log.Printf("Whiteboard persistence complete: %d succeeded, %d failed", successCount, errorCount)

	return nil
}

// PersistWhiteboard persists a single whiteboard's data to database
func (p *WhiteboardPersister) PersistWhiteboard(ctx context.Context, viewID string) error {
	// Get canvas objects from Redis
	canvasObjects, err := p.cache.GetCanvasObjects(ctx, viewID)
	if err != nil {
		return err
	}

	// Get view objects from Redis
	viewObjects, err := p.cache.GetViewObjects(ctx, viewID)
	if err != nil {
		return err
	}

	// Find the view in database
	view, err := p.db.FindView(model.View{ID: viewID})
	if err != nil {
		return err
	}

	// Only persist if it's a whiteboard view
	if view.Type != "whiteboard" {
		return nil
	}

	// Marshal canvas objects to JSON and store in view.data
	if len(canvasObjects) > 0 {
		canvasData, err := json.Marshal(canvasObjects)
		if err != nil {
			return err
		}
		view.Data = string(canvasData)

		// Update view in database
		if err := p.db.UpdateView(view); err != nil {
			return err
		}
	}

	// Persist view objects to view_objects table
	for _, obj := range viewObjects {
		// Convert to model.ViewObject
		viewObj := model.ViewObject{
			ID:     obj.ID,
			ViewID: viewID,
			Name:   obj.Name,
			Type:   obj.Type,
			Data:   string(obj.Data),
		}

		// Try to find existing view object
		existing, err := p.db.FindViewObject(model.ViewObject{ID: obj.ID})
		if err != nil {
			// Object doesn't exist, create it
			// Note: We need workspace_id and user_id for creation
			// For now, we'll get these from the view
			viewObj.CreatedBy = view.CreatedBy
			viewObj.UpdatedBy = view.UpdatedBy

			// Create view object
			if err := p.db.CreateViewObject(viewObj); err != nil {
				log.Printf("Warning: failed to create view object %s: %v", obj.ID, err)
			}
		} else {
			// Object exists, update it
			existing.Name = obj.Name
			existing.Type = obj.Type
			existing.Data = string(obj.Data)
			existing.UpdatedBy = view.UpdatedBy

			if err := p.db.UpdateViewObject(existing); err != nil {
				log.Printf("Warning: failed to update view object %s: %v", obj.ID, err)
			}
		}
	}

	log.Printf("Persisted whiteboard %s (canvas: %d objects, view objects: %d)",
		viewID, len(canvasObjects), len(viewObjects))

	return nil
}

// ForcePersist forces immediate persistence of all active whiteboards
func (p *WhiteboardPersister) ForcePersist() error {
	return p.PersistAll()
}

// ForcePersistWhiteboard forces immediate persistence of a specific whiteboard
func (p *WhiteboardPersister) ForcePersistWhiteboard(viewID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	return p.PersistWhiteboard(ctx, viewID)
}
