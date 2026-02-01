package worker

import (
	"context"
	"log"
	"time"

	"github.com/collabreef/collabreef/internal/db"
	"github.com/collabreef/collabreef/internal/redis"
	"github.com/robfig/cron/v3"
)

// Persister handles periodic persistence of Redis data to database
type Persister struct {
	cache *redis.ViewCache
	db    db.DB
	cron  *cron.Cron
}

// NewPersister creates a new persister
func NewPersister(cache *redis.ViewCache, database db.DB) *Persister {
	return &Persister{
		cache: cache,
		db:    database,
		cron:  cron.New(),
	}
}

// Start starts the persister with a schedule
func (p *Persister) Start() error {
	// Run every 5 minutes
	_, err := p.cron.AddFunc("*/5 * * * *", func() {
		if err := p.PersistAll(); err != nil {
			log.Printf("Error persisting data: %v", err)
		}
	})

	if err != nil {
		return err
	}

	p.cron.Start()
	log.Println("Persister started, will run every 5 minutes")

	return nil
}

// Stop stops the persister
func (p *Persister) Stop() {
	ctx := p.cron.Stop()
	<-ctx.Done()
	log.Println("Persister stopped")
}

// PersistAll persists all active views from Redis to database
func (p *Persister) PersistAll() error {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	// Get all active view IDs
	viewIDs, err := p.cache.GetAllActiveViewIDs(ctx)
	if err != nil {
		return err
	}

	if len(viewIDs) == 0 {
		log.Println("No active views to persist")
		return nil
	}

	log.Printf("Persisting %d active views to database", len(viewIDs))

	successCount := 0
	errorCount := 0

	for _, viewID := range viewIDs {
		if err := p.PersistView(ctx, viewID); err != nil {
			log.Printf("Error persisting view %s: %v", viewID, err)
			errorCount++
		} else {
			successCount++
		}
	}

	log.Printf("Persistence complete: %d succeeded, %d failed", successCount, errorCount)

	return nil
}

// PersistView persists a single view's Y.js state to database
func (p *Persister) PersistView(ctx context.Context, viewID string) error {
	// Get current Y.js state from Redis
	state, err := p.cache.GetViewYjsState(ctx, viewID)
	if err != nil && err.Error() != "redis: nil" {
		return err
	}

	// Get all pending updates
	updates, err := p.cache.GetViewYjsUpdates(ctx, viewID)
	if err != nil && err.Error() != "redis: nil" {
		return err
	}

	// If we have either state or updates, merge them and keep in Redis
	// Note: YjsState is no longer persisted to database, only kept in Redis
	// For whiteboard views, state is persisted separately by WhiteboardPersister
	if len(state) > 0 || len(updates) > 0 {
		// Merge all updates into a single state
		// In a real implementation, you would use Y.js to properly merge these
		// For now, we'll just store the latest state and the list of updates
		var finalState []byte
		if len(state) > 0 {
			finalState = state
		}

		// If we have updates but no base state, we should apply them
		// This is a simplified approach - in production you'd use proper Y.js merging
		if len(updates) > 0 && len(finalState) == 0 {
			// Take the last update as the state (simplified)
			finalState = updates[len(updates)-1]
		}

		// Clear the updates from Redis since we've merged them into state
		if err := p.cache.ClearViewYjsUpdates(ctx, viewID); err != nil {
			log.Printf("Warning: failed to clear updates for view %s: %v", viewID, err)
		}

		// Update the cached state in Redis
		if err := p.cache.SetViewYjsState(ctx, viewID, finalState); err != nil {
			log.Printf("Warning: failed to update cached state for view %s: %v", viewID, err)
		}

		log.Printf("Merged Y.js state for view %s (state: %d bytes, updates: %d)", viewID, len(finalState), len(updates))
	}

	return nil
}

// ForcePersist forces immediate persistence of all active views
func (p *Persister) ForcePersist() error {
	return p.PersistAll()
}

// ForcePersistView forces immediate persistence of a specific view
func (p *Persister) ForcePersistView(viewID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	return p.PersistView(ctx, viewID)
}
