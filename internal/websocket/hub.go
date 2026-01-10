package websocket

import (
	"log"
	"sync"
	"time"

	"github.com/notepia/notepia/internal/redis"
)

// Hub maintains the set of active rooms and coordinates their lifecycle
type Hub struct {
	// Registered rooms by view ID (can be either Y.js Room or WhiteboardRoom)
	rooms map[string]RoomInterface

	// Mutex for thread-safe access to rooms
	mu sync.RWMutex

	// Redis caches
	cache           *redis.ViewCache
	whiteboardCache *redis.WhiteboardCache

	// Cleanup ticker
	cleanupTicker *time.Ticker

	// Done channel for stopping cleanup
	done chan struct{}
}

// NewHub creates a new Hub
func NewHub(cache *redis.ViewCache, whiteboardCache *redis.WhiteboardCache) *Hub {
	hub := &Hub{
		rooms:           make(map[string]RoomInterface),
		cache:           cache,
		whiteboardCache: whiteboardCache,
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
			for viewID, room := range h.rooms {
				if room.ClientCount() == 0 {
					room.Stop()
					delete(h.rooms, viewID)
					log.Printf("Cleaned up empty room for view %s", viewID)
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

	for viewID, room := range h.rooms {
		room.Stop()
		log.Printf("Stopped room for view %s", viewID)
	}

	h.rooms = make(map[string]RoomInterface)
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
