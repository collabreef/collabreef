package websocket

import (
	"encoding/json"
	"log"

	"github.com/collabreef/collabreef/internal/redis"
)

// sendInitialStateToClient sends the current cached whiteboard state to a newly connected client
// This method ONLY sends what's already in Redis cache, it does NOT initialize from DB
// Initialization from DB is handled by the frontend client using Y.js
func (r *WhiteboardRoom) sendInitialStateToClient(client *Client) {
	// Recover from panic if client disconnects while sending
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Recovered from panic in sendInitialStateToClient for client %s: %v", client.UserID, r)
		}
	}()

	// Check if already initialized in Redis
	initialized, err := r.cache.IsWhiteboardInitialized(r.ctx, r.viewID)
	if err != nil {
		log.Printf("Error checking initialization status: %v", err)
	}

	// Get canvas objects from cache (empty if not initialized)
	canvasObjects, err := r.cache.GetCanvasObjects(r.ctx, r.viewID)
	if err != nil {
		log.Printf("Error loading canvas objects: %v", err)
		canvasObjects = make(map[string]redis.CanvasObject)
	}

	// Get view objects from cache (empty if not initialized)
	viewObjects, err := r.cache.GetViewObjects(r.ctx, r.viewID)
	if err != nil {
		log.Printf("Error loading view objects: %v", err)
		viewObjects = make(map[string]redis.ViewObject)
	}

	// Get Y.js state from cache if initialized
	var yjsState []byte
	if initialized {
		yjsState, err = r.cache.GetYjsState(r.ctx, r.viewID)
		if err != nil && err.Error() != "redis: nil" {
			log.Printf("Error loading Y.js state: %v", err)
		}
	}

	// Remove the _initialized marker if present
	delete(canvasObjects, "_initialized")
	delete(viewObjects, "_initialized")

	// Send initial state message with initialization status
	initMsg := WhiteboardMessage{
		Type:          WhiteboardMessageTypeInit,
		CanvasObjects: canvasObjects,
		ViewObjects:   viewObjects,
		Initialized:   initialized,
		YjsState:      yjsState,
	}

	data, err := json.Marshal(initMsg)
	if err != nil {
		log.Printf("Error marshaling init message: %v", err)
		return
	}

	select {
	case client.send <- data:
		log.Printf("Sent initial state to client %s (initialized=%v, %d canvas objects, %d view objects, Y.js state: %d bytes)",
			client.UserID, initialized, len(canvasObjects), len(viewObjects), len(yjsState))
	default:
		log.Printf("Failed to send initial state to client %s", client.UserID)
	}
}
