package websocket

import (
	"context"
	"encoding/json"
	"log"

	"github.com/collabreef/collabreef/internal/model"
	"github.com/collabreef/collabreef/internal/redis"
)

// NoteMessageType represents the type of note message
type NoteMessageType string

const (
	NoteMessageTypeInit          NoteMessageType = "init"
	NoteMessageTypeUpdateTitle   NoteMessageType = "update_title"
	NoteMessageTypeUpdateContent NoteMessageType = "update_content"
	NoteMessageTypeUserJoin      NoteMessageType = "user_join"
	NoteMessageTypeUserLeave     NoteMessageType = "user_leave"
	NoteMessageTypeActiveUsers   NoteMessageType = "active_users"
	NoteMessageTypeSnapshot      NoteMessageType = "snapshot"
	NoteMessageTypeNeedSnapshot  NoteMessageType = "need_snapshot"
	NoteMessageTypeSnapshotReady NoteMessageType = "snapshot_ready"
	NoteMessageTypeYjsUpdate     NoteMessageType = "yjs_update"
)

// NoteMessage represents a note WebSocket message
type NoteMessage struct {
	Type           NoteMessageType `json:"type"`
	Title          string          `json:"title,omitempty"`
	Content        string          `json:"content,omitempty"`
	User           *UserInfo       `json:"user,omitempty"`
	Users          []*UserInfo     `json:"users,omitempty"`
	Snapshot       []byte          `json:"snapshot,omitempty"`
	NeedInitialize bool            `json:"need_initialize,omitempty"`
	YjsUpdate      []byte          `json:"yjs_update,omitempty"` // Y.js CRDT update

	// Full note metadata for init message
	ID         string `json:"id,omitempty"`
	Visibility string `json:"visibility,omitempty"`
	CreatedAt  string `json:"created_at,omitempty"`
	CreatedBy  string `json:"created_by,omitempty"`
	UpdatedAt  string `json:"updated_at,omitempty"`
	UpdatedBy  string `json:"updated_by,omitempty"`
}

// UserInfo represents user information for collaboration
type UserInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// NoteRoom manages all clients for a specific note
type NoteRoom struct {
	// Note ID
	noteID string

	// Registered clients
	clients map[*Client]bool

	// Inbound messages from clients
	broadcast chan *Message

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Database connection
	db interface {
		FindNote(note model.Note) (model.Note, error)
	}

	// Note cache for persisting updates
	cache *redis.NoteCache

	// Context for cancellation
	ctx context.Context

	// Cancel function
	cancel context.CancelFunc
}

// NewNoteRoom creates a new note room
func NewNoteRoom(noteID string, database interface{ FindNote(note model.Note) (model.Note, error) }, cache *redis.NoteCache) *NoteRoom {
	ctx, cancel := context.WithCancel(context.Background())

	return &NoteRoom{
		noteID:     noteID,
		clients:    make(map[*Client]bool),
		broadcast:  make(chan *Message, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		db:         database,
		cache:      cache,
		ctx:        ctx,
		cancel:     cancel,
	}
}

// Run starts the note room's main loop
func (r *NoteRoom) Run() {
	defer func() {
		log.Printf("Note room %s stopped", r.noteID)
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
			log.Printf("Client %s (%s) joined note room %s. Total clients: %d",
				client.UserID, client.UserName, r.noteID, len(r.clients))

			// Send initial state to the new client
			go r.sendInitialStateToClient(client)

			// Broadcast user join to other clients
			r.broadcastUserJoin(client)

		case client := <-r.unregister:
			if _, ok := r.clients[client]; ok {
				delete(r.clients, client)
				close(client.send)
				log.Printf("Client %s (%s) left note room %s. Remaining clients: %d",
					client.UserID, client.UserName, r.noteID, len(r.clients))

				// Broadcast user leave to remaining clients
				r.broadcastUserLeave(client)
			}

		case message := <-r.broadcast:
			// Parse and handle the message
			r.handleMessage(message)
		}
	}
}

// handleMessage processes incoming note messages (both JSON and binary)
func (r *NoteRoom) handleMessage(msg *Message) {
	log.Printf("[NoteRoom] Received message from client %s, data length: %d bytes", msg.Sender.UserID, len(msg.Data))

	// Try to parse as JSON first (for title updates)
	var noteMsg NoteMessage
	if err := json.Unmarshal(msg.Data, &noteMsg); err == nil {
		log.Printf("[NoteRoom] Message is JSON, type: %s", noteMsg.Type)
		// It's a JSON message, handle title updates
		switch noteMsg.Type {
		case NoteMessageTypeUpdateTitle:
			// Update title in cache
			if err := r.cache.UpdateNoteTitle(r.ctx, r.noteID, noteMsg.Title, msg.Sender.UserID); err != nil {
				log.Printf("Error updating note title in cache: %v", err)
			}
			log.Printf("Updated note %s title by user %s", r.noteID, msg.Sender.UserID)

		case NoteMessageTypeUpdateContent:
			// Legacy: Update content in cache (kept for backwards compatibility)
			if err := r.cache.UpdateNoteContent(r.ctx, r.noteID, noteMsg.Content, msg.Sender.UserID); err != nil {
				log.Printf("Error updating note content in cache: %v", err)
			}
			log.Printf("Updated note %s content by user %s (legacy)", r.noteID, msg.Sender.UserID)

		case NoteMessageTypeSnapshot:
			// Client is sending a snapshot (happens when first client initializes)
			if noteMsg.Snapshot != nil {
				if err := r.cache.SetYjsSnapshot(r.ctx, r.noteID, noteMsg.Snapshot); err != nil {
					log.Printf("Error storing Y.js snapshot in cache: %v", err)
				} else {
					log.Printf("Stored Y.js snapshot for note %s (%d bytes) from client %s",
						r.noteID, len(noteMsg.Snapshot), msg.Sender.UserID)
				}
			}
			// Don't broadcast snapshot messages
			return

		case NoteMessageTypeYjsUpdate:
			// Client is sending a Y.js CRDT update + full content
			if noteMsg.YjsUpdate != nil {
				log.Printf("[NoteRoom] Received yjs_update message, size: %d bytes, content length: %d",
					len(noteMsg.YjsUpdate), len(noteMsg.Content))

				// Append update to Redis list
				if err := r.cache.AppendYjsUpdate(r.ctx, r.noteID, noteMsg.YjsUpdate); err != nil {
					log.Printf("[NoteRoom] Error appending Y.js update to cache: %v", err)
				} else {
					log.Printf("[NoteRoom] ✓ Appended Y.js update for note %s (%d bytes) from client %s",
						r.noteID, len(noteMsg.YjsUpdate), msg.Sender.UserID)
				}

				// Update full content in Redis cache for worker to persist to database
				if noteMsg.Content != "" {
					if err := r.cache.UpdateNoteContent(r.ctx, r.noteID, noteMsg.Content, msg.Sender.UserID); err != nil {
						log.Printf("[NoteRoom] Error updating note content in cache: %v", err)
					} else {
						log.Printf("[NoteRoom] ✓ Updated note content in cache for note %s from client %s",
							r.noteID, msg.Sender.UserID)
					}
				}
			}
			// Continue to broadcast this message
		}
	} else {
		// Unknown JSON message or invalid format
		log.Printf("[NoteRoom] Warning: received non-JSON message or unknown message type, size: %d bytes", len(msg.Data))
	}

	// Broadcast to all clients except sender
	broadcastCount := 0
	for client := range r.clients {
		if client != msg.Sender {
			select {
			case client.send <- msg.Data:
				broadcastCount++
			default:
				// Client's send buffer is full, remove client
				close(client.send)
				delete(r.clients, client)
				log.Printf("Client %s send buffer full, disconnecting", client.UserID)
			}
		}
	}
	log.Printf("[NoteRoom] Broadcasted message to %d other clients (total clients: %d)", broadcastCount, len(r.clients))

	// Refresh TTL since there's activity
	if err := r.cache.RefreshTTL(r.ctx, r.noteID); err != nil {
		log.Printf("Error refreshing TTL: %v", err)
	}
}

// broadcastUserJoin notifies all other clients that a user joined
func (r *NoteRoom) broadcastUserJoin(joinedClient *Client) {
	userInfo := &UserInfo{
		ID:   joinedClient.UserID,
		Name: joinedClient.UserName,
	}

	msg := NoteMessage{
		Type: NoteMessageTypeUserJoin,
		User: userInfo,
	}

	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling user join message: %v", err)
		return
	}

	// Send to all clients except the one who just joined
	for client := range r.clients {
		if client != joinedClient {
			select {
			case client.send <- data:
			default:
				log.Printf("Failed to send user join message to client %s", client.UserID)
			}
		}
	}
}

// broadcastUserLeave notifies all clients that a user left
func (r *NoteRoom) broadcastUserLeave(leftClient *Client) {
	userInfo := &UserInfo{
		ID:   leftClient.UserID,
		Name: leftClient.UserName,
	}

	msg := NoteMessage{
		Type: NoteMessageTypeUserLeave,
		User: userInfo,
	}

	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling user leave message: %v", err)
		return
	}

	// Send to all remaining clients
	for client := range r.clients {
		select {
		case client.send <- data:
		default:
			log.Printf("Failed to send user leave message to client %s", client.UserID)
		}
	}
}

// getActiveUsers returns a list of all active users in the room
func (r *NoteRoom) getActiveUsers() []*UserInfo {
	users := make([]*UserInfo, 0, len(r.clients))
	for client := range r.clients {
		users = append(users, &UserInfo{
			ID:   client.UserID,
			Name: client.UserName,
		})
	}
	return users
}

// Stop stops the room and disconnects all clients
func (r *NoteRoom) Stop() {
	r.cancel()
}

// ClientCount returns the number of clients in the room
func (r *NoteRoom) ClientCount() int {
	return len(r.clients)
}

// Register registers a client with the room
func (r *NoteRoom) Register(client *Client) {
	r.register <- client
}

// Unregister unregisters a client from the room
func (r *NoteRoom) Unregister(client *Client) {
	r.unregister <- client
}

// Broadcast sends a message to the room's broadcast channel
func (r *NoteRoom) Broadcast(message *Message) {
	r.broadcast <- message
}
