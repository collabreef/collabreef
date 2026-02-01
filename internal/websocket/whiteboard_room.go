package websocket

import (
	"context"
	"encoding/json"
	"log"

	"github.com/collabreef/collabreef/internal/redis"
)

// WhiteboardMessageType represents the type of whiteboard message
type WhiteboardMessageType string

const (
	WhiteboardMessageTypeAuth               WhiteboardMessageType = "auth"
	WhiteboardMessageTypeInit               WhiteboardMessageType = "init"
	WhiteboardMessageTypeAcquireLock        WhiteboardMessageType = "acquire_lock"
	WhiteboardMessageTypeLockAcquired       WhiteboardMessageType = "lock_acquired"
	WhiteboardMessageTypeInitializeData     WhiteboardMessageType = "initialize_data"
	WhiteboardMessageTypeAddCanvasObject    WhiteboardMessageType = "add_canvas_object"
	WhiteboardMessageTypeUpdateCanvasObject WhiteboardMessageType = "update_canvas_object"
	WhiteboardMessageTypeDeleteCanvasObject WhiteboardMessageType = "delete_canvas_object"
	WhiteboardMessageTypeAddViewObject      WhiteboardMessageType = "add_view_object"
	WhiteboardMessageTypeUpdateViewObject   WhiteboardMessageType = "update_view_object"
	WhiteboardMessageTypeDeleteViewObject   WhiteboardMessageType = "delete_view_object"
	WhiteboardMessageTypeClearAll           WhiteboardMessageType = "clear_all"
)

// WhiteboardMessage represents a whiteboard WebSocket message
type WhiteboardMessage struct {
	Type          WhiteboardMessageType          `json:"type"`
	Token         string                         `json:"token,omitempty"`
	CanvasObjects map[string]redis.CanvasObject  `json:"canvas_objects,omitempty"`
	ViewObjects   map[string]redis.ViewObject    `json:"view_objects,omitempty"`
	Object        json.RawMessage                `json:"object,omitempty"`
	ID            string                         `json:"id,omitempty"`
	Initialized   bool                           `json:"initialized,omitempty"`
	LockAcquired  bool                           `json:"lock_acquired,omitempty"`
	YjsState      []byte                         `json:"yjs_state,omitempty"`
}

// WhiteboardRoom manages all clients for a specific whiteboard view
type WhiteboardRoom struct {
	// View ID
	viewID string

	// Registered clients
	clients map[*Client]bool

	// Inbound messages from clients
	broadcast chan *Message

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Whiteboard cache for persisting updates
	cache *redis.WhiteboardCache

	// Context for cancellation
	ctx context.Context

	// Cancel function
	cancel context.CancelFunc

	// Track if room has been initialized
	initialized bool
}

// NewWhiteboardRoom creates a new whiteboard room
func NewWhiteboardRoom(viewID string, cache *redis.WhiteboardCache) *WhiteboardRoom {
	ctx, cancel := context.WithCancel(context.Background())

	return &WhiteboardRoom{
		viewID:      viewID,
		clients:     make(map[*Client]bool),
		broadcast:   make(chan *Message, 256),
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		cache:       cache,
		ctx:         ctx,
		cancel:      cancel,
		initialized: false,
	}
}

// Run starts the whiteboard room's main loop
func (r *WhiteboardRoom) Run() {
	defer func() {
		log.Printf("Whiteboard room %s stopped", r.viewID)
	}()

	for {
		select {
		case <-r.ctx.Done():
			// Room is being shut down
			for client := range r.clients {
				close(client.send)
			}
			return

		case client := <-r.register:
			r.clients[client] = true
			log.Printf("Client %s (%s) joined whiteboard room %s. Total clients: %d",
				client.UserID, client.UserName, r.viewID, len(r.clients))

			// Send initial state to the new client
			go r.sendInitialStateToClient(client)

		case client := <-r.unregister:
			if _, ok := r.clients[client]; ok {
				delete(r.clients, client)
				close(client.send)
				log.Printf("Client %s (%s) left whiteboard room %s. Remaining clients: %d",
					client.UserID, client.UserName, r.viewID, len(r.clients))
			}

		case message := <-r.broadcast:
			// Parse and handle the message
			r.handleMessage(message)
		}
	}
}


// handleMessage processes incoming whiteboard messages
func (r *WhiteboardRoom) handleMessage(msg *Message) {
	// Parse the JSON message
	var whiteboardMsg WhiteboardMessage
	if err := json.Unmarshal(msg.Data, &whiteboardMsg); err != nil {
		log.Printf("Error parsing whiteboard message: %v", err)
		return
	}

	// Ignore write operations from read-only clients
	// Only allow them to receive messages (handled by broadcast)
	if msg.Sender.IsReadOnly {
		switch whiteboardMsg.Type {
		case WhiteboardMessageTypeAcquireLock:
			// Allow read-only clients to try acquiring lock (will be denied if needed)
		default:
			// Ignore all write operations from read-only clients
			log.Printf("Ignoring write operation from read-only client %s: %s", msg.Sender.UserID, whiteboardMsg.Type)
			return
		}
	}

	switch whiteboardMsg.Type {
	case WhiteboardMessageTypeAcquireLock:
		// Client wants to acquire initialization lock
		acquired, err := r.cache.AcquireWhiteboardInitLock(r.ctx, r.viewID)
		if err != nil {
			log.Printf("Error acquiring init lock: %v", err)
			acquired = false
		}

		// Send response back to the requesting client
		response := WhiteboardMessage{
			Type:         WhiteboardMessageTypeLockAcquired,
			LockAcquired: acquired,
		}
		data, err := json.Marshal(response)
		if err != nil {
			log.Printf("Error marshaling lock response: %v", err)
			return
		}

		select {
		case msg.Sender.send <- data:
			log.Printf("Sent lock acquisition response to client %s: %v", msg.Sender.UserID, acquired)
		default:
			log.Printf("Failed to send lock response to client %s", msg.Sender.UserID)
		}

	case WhiteboardMessageTypeInitializeData:
		// Client is sending initial data after fetching from DB and converting with Y.js
		// Store canvas objects
		if whiteboardMsg.CanvasObjects != nil {
			for id, obj := range whiteboardMsg.CanvasObjects {
				obj.ID = id
				if err := r.cache.SetCanvasObject(r.ctx, r.viewID, obj); err != nil {
					log.Printf("Error storing canvas object during init: %v", err)
				}
			}
		}

		// Store view objects
		if whiteboardMsg.ViewObjects != nil {
			for id, obj := range whiteboardMsg.ViewObjects {
				obj.ID = id
				if err := r.cache.SetViewObject(r.ctx, r.viewID, obj); err != nil {
					log.Printf("Error storing view object during init: %v", err)
				}
			}
		}

		// Store Y.js CRDT state
		if whiteboardMsg.YjsState != nil && len(whiteboardMsg.YjsState) > 0 {
			if err := r.cache.SetYjsState(r.ctx, r.viewID, whiteboardMsg.YjsState); err != nil {
				log.Printf("Error storing Y.js state during init: %v", err)
			}
		}

		// Mark as initialized
		if err := r.cache.MarkWhiteboardInitialized(r.ctx, r.viewID); err != nil {
			log.Printf("Error marking whiteboard as initialized: %v", err)
		}

		// Release the lock
		if err := r.cache.ReleaseWhiteboardInitLock(r.ctx, r.viewID); err != nil {
			log.Printf("Error releasing init lock: %v", err)
		}

		log.Printf("Whiteboard %s initialized by client %s (Y.js state: %d bytes)",
			r.viewID, msg.Sender.UserID, len(whiteboardMsg.YjsState))

		// Broadcast the initialization data (including Y.js state) to all other clients for CRDT synchronization
		// Don't send back to the sender as they already have it
		for client := range r.clients {
			if client != msg.Sender {
				select {
				case client.send <- msg.Data:
				default:
					close(client.send)
					delete(r.clients, client)
					log.Printf("Client %s send buffer full during init, disconnecting", client.UserID)
				}
			}
		}

	case WhiteboardMessageTypeAddCanvasObject, WhiteboardMessageTypeUpdateCanvasObject:
		// Parse the object
		var obj redis.CanvasObject
		if err := json.Unmarshal(whiteboardMsg.Object, &obj); err != nil {
			log.Printf("Error parsing canvas object: %v", err)
			return
		}

		// Store in cache
		if err := r.cache.SetCanvasObject(r.ctx, r.viewID, obj); err != nil {
			log.Printf("Error storing canvas object in cache: %v", err)
		}

	case WhiteboardMessageTypeDeleteCanvasObject:
		// Delete from cache
		if err := r.cache.DeleteCanvasObject(r.ctx, r.viewID, whiteboardMsg.ID); err != nil {
			log.Printf("Error deleting canvas object from cache: %v", err)
		}

	case WhiteboardMessageTypeAddViewObject, WhiteboardMessageTypeUpdateViewObject:
		// Parse the object
		var obj redis.ViewObject
		if err := json.Unmarshal(whiteboardMsg.Object, &obj); err != nil {
			log.Printf("Error parsing view object: %v", err)
			return
		}

		// Store in cache
		if err := r.cache.SetViewObject(r.ctx, r.viewID, obj); err != nil {
			log.Printf("Error storing view object in cache: %v", err)
		}

	case WhiteboardMessageTypeDeleteViewObject:
		// Delete from cache
		if err := r.cache.DeleteViewObject(r.ctx, r.viewID, whiteboardMsg.ID); err != nil {
			log.Printf("Error deleting view object from cache: %v", err)
		}

	case WhiteboardMessageTypeClearAll:
		// Clear all objects from cache
		if err := r.cache.ClearCanvasObjects(r.ctx, r.viewID); err != nil {
			log.Printf("Error clearing canvas objects: %v", err)
		}
		if err := r.cache.ClearViewObjects(r.ctx, r.viewID); err != nil {
			log.Printf("Error clearing view objects: %v", err)
		}
		// Re-mark as initialized so new clients don't reload from DB
		if err := r.cache.MarkWhiteboardInitialized(r.ctx, r.viewID); err != nil {
			log.Printf("Error re-marking whiteboard as initialized: %v", err)
		}
		log.Printf("Cleared all objects from whiteboard %s", r.viewID)
	}

	// Broadcast to all clients except sender
	for client := range r.clients {
		if client != msg.Sender {
			select {
			case client.send <- msg.Data:
			default:
				// Client's send buffer is full, remove client
				close(client.send)
				delete(r.clients, client)
				log.Printf("Client %s send buffer full, disconnecting", client.UserID)
			}
		}
	}

	// Refresh TTL since there's activity
	if err := r.cache.RefreshTTL(r.ctx, r.viewID); err != nil {
		log.Printf("Error refreshing TTL: %v", err)
	}
}

// Stop stops the room and disconnects all clients
func (r *WhiteboardRoom) Stop() {
	r.cancel()
}

// ClientCount returns the number of clients in the room
func (r *WhiteboardRoom) ClientCount() int {
	return len(r.clients)
}

// Register registers a client with the room
func (r *WhiteboardRoom) Register(client *Client) {
	r.register <- client
}

// Unregister unregisters a client from the room
func (r *WhiteboardRoom) Unregister(client *Client) {
	r.unregister <- client
}

// Broadcast sends a message to the room's broadcast channel
func (r *WhiteboardRoom) Broadcast(message *Message) {
	r.broadcast <- message
}
