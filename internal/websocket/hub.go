package websocket

import (
	"log"
	"sync"
	"time"

	"github.com/collabreef/collabreef/internal/db"
	"github.com/collabreef/collabreef/internal/redis"
)

// Hub maintains the set of active rooms and coordinates their lifecycle
type Hub struct {
	// Registered rooms by view ID (can be either Y.js Room or WhiteboardRoom)
	rooms map[string]RoomInterface

	// Registered note rooms by note ID
	noteRooms map[string]*NoteRoom

	// Mutex for thread-safe access to rooms
	mu sync.RWMutex

	// Database connection
	db db.DB

	// Redis caches
	cache           *redis.ViewCache
	whiteboardCache *redis.WhiteboardCache
	noteCache       *redis.NoteCache

	// Cleanup ticker
	cleanupTicker *time.Ticker

	// Done channel for stopping cleanup
	done chan struct{}
}

// NewHub creates a new Hub
func NewHub(database db.DB, cache *redis.ViewCache, whiteboardCache *redis.WhiteboardCache, noteCache *redis.NoteCache) *Hub {
	hub := &Hub{
		rooms:           make(map[string]RoomInterface),
		noteRooms:       make(map[string]*NoteRoom),
		db:              database,
		cache:           cache,
		whiteboardCache: whiteboardCache,
		noteCache:       noteCache,
		cleanupTicker:   time.NewTicker(5 * time.Minute),
		done:            make(chan struct{}),
	}

	// Start cleanup goroutine
	go hub.cleanupEmptyRooms()

	return hub
}

// GetOrCreateRoom gets an existing room or creates a new one (Y.js room for non-whiteboard views)
func (h *Hub) GetOrCreateRoom(viewID string) RoomInterface {
	h.mu.Lock()
	defer h.mu.Unlock()

	room, exists := h.rooms[viewID]
	if !exists {
		room = NewRoom(viewID, h.cache)
		h.rooms[viewID] = room

		// Start the room's event loop
		go room.Run()

		log.Printf("Created new Y.js room for view %s", viewID)
	}

	return room
}

// GetOrCreateWhiteboardRoom gets an existing room or creates a new whiteboard room
func (h *Hub) GetOrCreateWhiteboardRoom(viewID string) RoomInterface {
	h.mu.Lock()
	defer h.mu.Unlock()

	room, exists := h.rooms[viewID]
	if !exists {
		room = NewWhiteboardRoom(viewID, h.whiteboardCache)
		h.rooms[viewID] = room

		// Start the room's event loop
		go room.Run()

		log.Printf("Created new whiteboard room for view %s", viewID)
	}

	return room
}

// GetOrCreateNoteRoom gets an existing room or creates a new note room
func (h *Hub) GetOrCreateNoteRoom(noteID string) *NoteRoom {
	h.mu.Lock()
	defer h.mu.Unlock()

	room, exists := h.noteRooms[noteID]
	if !exists {
		room = NewNoteRoom(noteID, h.db, h.noteCache)
		h.noteRooms[noteID] = room

		// Start the room's event loop
		go room.Run()

		log.Printf("Created new note room for note %s", noteID)
	}

	return room
}

// GetRoom gets an existing room (returns nil if not found)
func (h *Hub) GetRoom(viewID string) RoomInterface {
	h.mu.RLock()
	defer h.mu.RUnlock()

	return h.rooms[viewID]
}

// RemoveRoom removes a room from the hub
func (h *Hub) RemoveRoom(viewID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if room, exists := h.rooms[viewID]; exists {
		room.Stop()
		delete(h.rooms, viewID)
		log.Printf("Removed room for view %s", viewID)
	}
}

// cleanupEmptyRooms periodically removes rooms with no clients
func (h *Hub) cleanupEmptyRooms() {
	for {
		select {
		case <-h.cleanupTicker.C:
			h.mu.Lock()
			// Clean up view rooms
			for viewID, room := range h.rooms {
				if room.ClientCount() == 0 {
					room.Stop()
					delete(h.rooms, viewID)
					log.Printf("Cleaned up empty room for view %s", viewID)
				}
			}
			// Clean up note rooms
			for noteID, room := range h.noteRooms {
				if room.ClientCount() == 0 {
					room.Stop()
					delete(h.noteRooms, noteID)
					log.Printf("Cleaned up empty note room for note %s", noteID)
				}
			}
			h.mu.Unlock()

		case <-h.done:
			return
		}
	}
}

// Stop stops the hub and all rooms
func (h *Hub) Stop() {
	h.cleanupTicker.Stop()
	close(h.done)

	h.mu.Lock()
	defer h.mu.Unlock()

	// Stop view rooms
	for viewID, room := range h.rooms {
		room.Stop()
		log.Printf("Stopped room for view %s", viewID)
	}

	// Stop note rooms
	for noteID, room := range h.noteRooms {
		room.Stop()
		log.Printf("Stopped note room for note %s", noteID)
	}

	h.rooms = make(map[string]RoomInterface)
	h.noteRooms = make(map[string]*NoteRoom)
}

// Stats returns statistics about the hub
func (h *Hub) Stats() map[string]interface{} {
	h.mu.RLock()
	defer h.mu.RUnlock()

	totalClients := 0
	roomStats := make(map[string]int)

	for viewID, room := range h.rooms {
		clientCount := room.ClientCount()
		totalClients += clientCount
		roomStats[viewID] = clientCount
	}

	return map[string]interface{}{
		"total_rooms":   len(h.rooms),
		"total_clients": totalClients,
		"rooms":         roomStats,
	}
}
