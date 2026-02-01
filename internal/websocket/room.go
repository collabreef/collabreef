package websocket

import (
	"context"
	"log"

	"github.com/collabreef/collabreef/internal/redis"
)

// MessageType represents the type of WebSocket message
type MessageType string

const (
	// MessageTypeYjsUpdate represents a Y.js update message
	MessageTypeYjsUpdate MessageType = "yjs_update"

	// MessageTypeSync represents a sync request message
	MessageTypeSync MessageType = "sync"

	// MessageTypeAwareness represents an awareness update message
	MessageTypeAwareness MessageType = "awareness"
)

// Message represents a WebSocket message
type Message struct {
	Type   MessageType
	Data   []byte
	Sender *Client
}

// Room manages all clients for a specific view
type Room struct {
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

	// Redis cache for persisting updates
	cache *redis.ViewCache

	// Context for cancellation
	ctx context.Context

	// Cancel function
	cancel context.CancelFunc
}

// NewRoom creates a new room for a view
func NewRoom(viewID string, cache *redis.ViewCache) *Room {
	ctx, cancel := context.WithCancel(context.Background())

	return &Room{
		viewID:     viewID,
		clients:    make(map[*Client]bool),
		broadcast:  make(chan *Message, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		cache:      cache,
		ctx:        ctx,
		cancel:     cancel,
	}
}

// Run starts the room's main loop
func (r *Room) Run() {
	defer func() {
		// Clean up when room is closed
		log.Printf("Room %s stopped", r.viewID)
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
			log.Printf("Client %s (%s) joined room %s. Total clients: %d",
				client.UserID, client.UserName, r.viewID, len(r.clients))

			// Send current Y.js state to the new client
			go r.sendInitialState(client)

		case client := <-r.unregister:
			if _, ok := r.clients[client]; ok {
				delete(r.clients, client)
				close(client.send)
				log.Printf("Client %s (%s) left room %s. Remaining clients: %d",
					client.UserID, client.UserName, r.viewID, len(r.clients))
			}

		case message := <-r.broadcast:
			// Store update in Redis
			if message.Type == MessageTypeYjsUpdate {
				if err := r.cache.AppendViewYjsUpdate(r.ctx, r.viewID, message.Data); err != nil {
					log.Printf("Error storing Y.js update in Redis: %v", err)
				}
			}

			// Broadcast to all clients except sender
			for client := range r.clients {
				if client != message.Sender {
					select {
					case client.send <- message.Data:
					default:
						// Client's send buffer is full, remove client
						close(client.send)
						delete(r.clients, client)
						log.Printf("Client %s send buffer full, disconnecting", client.UserID)
					}
				}
			}

			// Refresh TTL since there's activity
			if err := r.cache.RefreshViewTTL(r.ctx, r.viewID); err != nil {
				log.Printf("Error refreshing TTL: %v", err)
			}
		}
	}
}

// sendInitialState sends the current Y.js state to a newly connected client
func (r *Room) sendInitialState(client *Client) {
	// Recover from panic if client disconnects while sending
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Recovered from panic in sendInitialState for client %s: %v", client.UserID, r)
		}
	}()

	// Try to get cached Y.js state
	state, err := r.cache.GetViewYjsState(r.ctx, r.viewID)
	if err == nil && len(state) > 0 {
		// Send the full state
		select {
		case client.send <- state:
			log.Printf("Sent initial Y.js state to client %s (%d bytes)", client.UserID, len(state))
		default:
			log.Printf("Failed to send initial state to client %s", client.UserID)
		}
	}

	// Also send any pending updates
	updates, err := r.cache.GetViewYjsUpdates(r.ctx, r.viewID)
	if err == nil {
		for _, update := range updates {
			select {
			case client.send <- update:
			default:
				log.Printf("Failed to send update to client %s", client.UserID)
				break
			}
		}
		if len(updates) > 0 {
			log.Printf("Sent %d pending updates to client %s", len(updates), client.UserID)
		}
	}
}

// Stop stops the room and disconnects all clients
func (r *Room) Stop() {
	r.cancel()
}

// ClientCount returns the number of clients in the room
func (r *Room) ClientCount() int {
	return len(r.clients)
}

// Register registers a client with the room
func (r *Room) Register(client *Client) {
	r.register <- client
}

// Unregister unregisters a client from the room
func (r *Room) Unregister(client *Client) {
	r.unregister <- client
}

// Broadcast sends a message to the room's broadcast channel
func (r *Room) Broadcast(message *Message) {
	r.broadcast <- message
}
