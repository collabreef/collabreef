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

// SpreadsheetPersister handles periodic persistence of spreadsheet data from Redis to database
type SpreadsheetPersister struct {
	cache *redis.SpreadsheetCache
	db    db.DB
	cron  *cron.Cron
}

// NewSpreadsheetPersister creates a new spreadsheet persister
func NewSpreadsheetPersister(cache *redis.SpreadsheetCache, database db.DB) *SpreadsheetPersister {
	return &SpreadsheetPersister{
		cache: cache,
		db:    database,
		cron:  cron.New(cron.WithSeconds()),
	}
}

// Start starts the persister with a schedule
func (p *SpreadsheetPersister) Start() error {
	// Run every 30 seconds
	_, err := p.cron.AddFunc("*/30 * * * * *", func() {
		log.Println("Spreadsheet persister tick")
		if err := p.PersistAll(); err != nil {
			log.Printf("Error persisting spreadsheet data: %v", err)
		}
	})

	if err != nil {
		return err
	}

	p.cron.Start()
	log.Println("Spreadsheet persister started, will run every 30 seconds")

	return nil
}

// Stop stops the persister
func (p *SpreadsheetPersister) Stop() {
	ctx := p.cron.Stop()
	<-ctx.Done()
	log.Println("Spreadsheet persister stopped")
}

// PersistAll persists all active spreadsheets from Redis to database
func (p *SpreadsheetPersister) PersistAll() error {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	// Get all active spreadsheet IDs
	viewIDs, err := p.cache.GetAllActiveSpreadsheetIDs(ctx)
	if err != nil {
		log.Printf("Error getting active spreadsheet IDs: %v", err)
		return err
	}

	log.Printf("Found %d active spreadsheet IDs: %v", len(viewIDs), viewIDs)

	if len(viewIDs) == 0 {
		log.Println("No active spreadsheets to persist")
		return nil
	}

	log.Printf("Persisting %d active spreadsheets to database", len(viewIDs))

	successCount := 0
	errorCount := 0

	for _, viewID := range viewIDs {
		if err := p.PersistSpreadsheet(ctx, viewID); err != nil {
			log.Printf("Error persisting spreadsheet %s: %v", viewID, err)
			errorCount++
		} else {
			successCount++
		}
	}

	log.Printf("Spreadsheet persistence complete: %d succeeded, %d failed", successCount, errorCount)

	return nil
}

// PersistSpreadsheet persists a single spreadsheet's data to database
func (p *SpreadsheetPersister) PersistSpreadsheet(ctx context.Context, viewID string) error {
	// Get sheets from Redis
	sheets, err := p.cache.GetSheets(ctx, viewID)
	if err != nil && err.Error() != "redis: nil" {
		log.Printf("Error getting sheets from Redis for %s: %v", viewID, err)
		return err
	}

	log.Printf("Got sheets from Redis for %s: %d bytes", viewID, len(sheets))

	// Find the view in database
	view, err := p.db.FindView(model.View{ID: viewID})
	if err != nil {
		log.Printf("Error finding view %s in database: %v", viewID, err)
		return err
	}

	// Only persist if it's a spreadsheet view
	if view.Type != "spreadsheet" {
		log.Printf("View %s is not a spreadsheet (type=%s), skipping", viewID, view.Type)
		return nil
	}

	// Store sheets in view.data
	if sheets != nil && len(sheets) > 0 {
		view.Data = string(sheets)
		log.Printf("Updating view %s with %d bytes of data", viewID, len(sheets))
	} else {
		log.Printf("No sheets data to persist for %s", viewID)
		return nil
	}

	// Update view in database
	if err := p.db.UpdateView(view); err != nil {
		log.Printf("Error updating view %s in database: %v", viewID, err)
		return err
	}

	log.Printf("Successfully persisted spreadsheet %s", viewID)

	return nil
}

// ForcePersist forces immediate persistence of all active spreadsheets
func (p *SpreadsheetPersister) ForcePersist() error {
	return p.PersistAll()
}

// ForcePersistSpreadsheet forces immediate persistence of a specific spreadsheet
func (p *SpreadsheetPersister) ForcePersistSpreadsheet(viewID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	return p.PersistSpreadsheet(ctx, viewID)
}
