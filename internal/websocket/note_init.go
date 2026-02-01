package websocket

import (
	"encoding/json"
	"log"

	"github.com/collabreef/collabreef/internal/model"
)

// sendInitialStateToClient sends the current note state to a newly connected client
// Implements snapshot + updates initialization strategy
func (r *NoteRoom) sendInitialStateToClient(client *Client) {
	// Recover from panic if client disconnects while sending
	defer func() {
		if rec := recover(); rec != nil {
			log.Printf("Recovered from panic in sendInitialStateToClient for client %s: %v", client.UserID, rec)
		}
	}()

	// Get active users in the room
	activeUsers := r.getActiveUsers()

	// Load full note metadata from database
	dbNote := model.Note{ID: r.noteID}
	note, err := r.db.FindNote(dbNote)
	if err != nil {
		log.Printf("Error loading note from database: %v", err)
		return
	}

	// Try to get latest title/content from Redis cache
	var title, content, updatedAt, updatedBy string
	title = note.Title
	content = note.Content
	updatedAt = note.UpdatedAt
	updatedBy = note.UpdatedBy

	noteData, err := r.cache.GetNoteData(r.ctx, r.noteID)
	if err == nil && noteData != nil {
		// Use cache data if available (more recent)
		title = noteData.Title
		content = noteData.Content
		updatedAt = noteData.UpdatedAt
		updatedBy = noteData.UpdatedBy
		log.Printf("Note %s data loaded from Redis cache", r.noteID)
	} else {
		log.Printf("Note %s data loaded from database", r.noteID)
	}

	// Check if Y.js snapshot exists in Redis
	hasSnapshot, err := r.cache.HasYjsSnapshot(r.ctx, r.noteID)
	if err != nil {
		log.Printf("Error checking for Y.js snapshot: %v", err)
		hasSnapshot = false
	}

	// If no snapshot exists, this client might need to initialize it
	needInitialize := !hasSnapshot

	// Send initial state message with full note metadata (JSON)
	initMsg := NoteMessage{
		Type:           NoteMessageTypeInit,
		ID:             note.ID,
		Title:          title,
		Content:        content, // Fallback if Y.js not available
		Visibility:     note.Visibility,
		CreatedAt:      note.CreatedAt,
		CreatedBy:      note.CreatedBy,
		UpdatedAt:      updatedAt,
		UpdatedBy:      updatedBy,
		Users:          activeUsers,
		NeedInitialize: needInitialize,
	}

	data, err := json.Marshal(initMsg)
	if err != nil {
		log.Printf("Error marshaling note init message: %v", err)
		return
	}

	select {
	case client.send <- data:
		log.Printf("Sent initial note state to client %s (title=%s, content_length=%d, need_init=%v, active_users=%d)",
			client.UserID, title, len(content), needInitialize, len(activeUsers))
	default:
		log.Printf("Failed to send initial state to client %s", client.UserID)
		return
	}

	// If snapshot exists, send snapshot + updates
	if hasSnapshot {
		// Get Y.js snapshot
		snapshot, err := r.cache.GetYjsSnapshot(r.ctx, r.noteID)
		if err != nil {
			log.Printf("Error loading Y.js snapshot from cache: %v", err)
		} else if len(snapshot) > 0 {
			// Send snapshot as JSON message
			snapshotMsg := NoteMessage{
				Type:     NoteMessageTypeSnapshot,
				Snapshot: snapshot,
			}
			snapshotData, err := json.Marshal(snapshotMsg)
			if err != nil {
				log.Printf("Error marshaling snapshot message: %v", err)
			} else {
				select {
				case client.send <- snapshotData:
					log.Printf("Sent Y.js snapshot to client %s (%d bytes)", client.UserID, len(snapshot))
				default:
					log.Printf("Failed to send Y.js snapshot to client %s", client.UserID)
					return
				}
			}
		}

		// Get all updates since snapshot
		updates, err := r.cache.GetYjsUpdates(r.ctx, r.noteID)
		if err != nil {
			log.Printf("Error loading Y.js updates from cache: %v", err)
		} else {
			// Send each update as JSON message
			for i, update := range updates {
				updateMsg := NoteMessage{
					Type:      NoteMessageTypeYjsUpdate,
					YjsUpdate: update,
				}
				updateData, err := json.Marshal(updateMsg)
				if err != nil {
					log.Printf("Error marshaling update message: %v", err)
					continue
				}
				select {
				case client.send <- updateData:
					log.Printf("Sent Y.js update %d/%d to client %s (%d bytes)",
						i+1, len(updates), client.UserID, len(update))
				default:
					log.Printf("Failed to send Y.js update %d to client %s", i+1, client.UserID)
					return
				}
			}
		}

		// Send snapshot ready message
		readyMsg := NoteMessage{
			Type: NoteMessageTypeSnapshotReady,
		}
		readyData, err := json.Marshal(readyMsg)
		if err == nil {
			select {
			case client.send <- readyData:
				log.Printf("Sent snapshot ready message to client %s", client.UserID)
			default:
				log.Printf("Failed to send snapshot ready message to client %s", client.UserID)
			}
		}
	}
}
