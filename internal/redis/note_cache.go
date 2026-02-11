package redis

import (
	"context"
	"fmt"
	"strings"
	"time"
)

const (
	// Cache key patterns for note
	noteDataKey        = "note:%s:data"
	noteYjsStateKey    = "note:%s:yjsstate"
	noteYjsSnapshotKey = "note:%s:yjs:snapshot"      // Y.Doc snapshot (state vector)
	noteYjsUpdatesKey  = "note:%s:yjs:updates"       // List of Y.js updates
	noteYjsLockKey     = "note:%s:yjs:lock"          // Lock for snapshot initialization

	// TTL for cached data (24 hours)
	noteCacheTTL = 24 * time.Hour
	// Lock TTL (30 seconds)
	noteLockTTL = 30 * time.Second
)

// NoteCache handles caching of note data
type NoteCache struct {
	client *Client
}

// NewNoteCache creates a new NoteCache
func NewNoteCache(client *Client) *NoteCache {
	return &NoteCache{client: client}
}

// NoteData represents the cached note data
type NoteData struct {
	Title      string `json:"title"`
	Content    string `json:"content"`
	Visibility string `json:"visibility"`
	CreatedAt  string `json:"created_at"`
	CreatedBy  string `json:"created_by"`
	UpdatedAt  string `json:"updated_at"`
	UpdatedBy  string `json:"updated_by"`
}

// GetNoteData retrieves note data from cache
func (nc *NoteCache) GetNoteData(ctx context.Context, noteID string) (*NoteData, error) {
	key := fmt.Sprintf(noteDataKey, noteID)

	// Get all fields from hash
	result, err := nc.client.rdb.HGetAll(ctx, key).Result()
	if err != nil {
		return nil, err
	}

	// Check if note exists in cache
	if len(result) == 0 {
		return nil, nil // Not found
	}

	noteData := &NoteData{
		Title:      result["title"],
		Content:    result["content"],
		Visibility: result["visibility"],
		CreatedAt:  result["created_at"],
		CreatedBy:  result["created_by"],
		UpdatedAt:  result["updated_at"],
		UpdatedBy:  result["updated_by"],
	}

	return noteData, nil
}

// SetNoteData stores complete note data in cache
func (nc *NoteCache) SetNoteData(ctx context.Context, noteID string, data *NoteData) error {
	key := fmt.Sprintf(noteDataKey, noteID)

	// Store all fields in hash
	pipe := nc.client.rdb.Pipeline()
	pipe.HSet(ctx, key, map[string]interface{}{
		"title":      data.Title,
		"content":    data.Content,
		"visibility": data.Visibility,
		"created_at": data.CreatedAt,
		"created_by": data.CreatedBy,
		"updated_at": data.UpdatedAt,
		"updated_by": data.UpdatedBy,
	})
	pipe.Expire(ctx, key, noteCacheTTL)

	_, err := pipe.Exec(ctx)
	return err
}

// UpdateNoteTitle updates only the title field
func (nc *NoteCache) UpdateNoteTitle(ctx context.Context, noteID, title, updatedBy string) error {
	key := fmt.Sprintf(noteDataKey, noteID)
	updatedAt := time.Now().Format(time.RFC3339)

	pipe := nc.client.rdb.Pipeline()
	pipe.HSet(ctx, key, map[string]interface{}{
		"title":      title,
		"updated_at": updatedAt,
		"updated_by": updatedBy,
	})
	pipe.Expire(ctx, key, noteCacheTTL)

	_, err := pipe.Exec(ctx)
	return err
}

// UpdateNoteContent updates only the content field
func (nc *NoteCache) UpdateNoteContent(ctx context.Context, noteID, content, updatedBy string) error {
	key := fmt.Sprintf(noteDataKey, noteID)
	updatedAt := time.Now().Format(time.RFC3339)

	pipe := nc.client.rdb.Pipeline()
	pipe.HSet(ctx, key, map[string]interface{}{
		"content":    content,
		"updated_at": updatedAt,
		"updated_by": updatedBy,
	})
	pipe.Expire(ctx, key, noteCacheTTL)

	_, err := pipe.Exec(ctx)
	return err
}

// DeleteNoteData deletes note data from cache
func (nc *NoteCache) DeleteNoteData(ctx context.Context, noteID string) error {
	key := fmt.Sprintf(noteDataKey, noteID)
	return nc.client.rdb.Del(ctx, key).Err()
}

// RefreshTTL refreshes the TTL for a note's cached data
func (nc *NoteCache) RefreshTTL(ctx context.Context, noteID string) error {
	dataKey := fmt.Sprintf(noteDataKey, noteID)
	yjsKey := fmt.Sprintf(noteYjsStateKey, noteID)

	pipe := nc.client.rdb.Pipeline()
	pipe.Expire(ctx, dataKey, noteCacheTTL)
	pipe.Expire(ctx, yjsKey, noteCacheTTL)

	_, err := pipe.Exec(ctx)
	return err
}

// GetYjsState retrieves the Y.js CRDT state for a note
func (nc *NoteCache) GetYjsState(ctx context.Context, noteID string) ([]byte, error) {
	key := fmt.Sprintf(noteYjsStateKey, noteID)
	return nc.client.rdb.Get(ctx, key).Bytes()
}

// SetYjsState stores the Y.js CRDT state for a note
func (nc *NoteCache) SetYjsState(ctx context.Context, noteID string, state []byte) error {
	key := fmt.Sprintf(noteYjsStateKey, noteID)
	return nc.client.rdb.Set(ctx, key, state, noteCacheTTL).Err()
}

// GetAllActiveNoteIDs returns all active note IDs from cache
func (nc *NoteCache) GetAllActiveNoteIDs(ctx context.Context) ([]string, error) {
	pattern := "note:*:data"
	var noteIDs []string

	iter := nc.client.rdb.Scan(ctx, 0, pattern, 0).Iterator()
	for iter.Next(ctx) {
		key := iter.Val()
		// Extract note ID from key (e.g., "note:abc123:data" -> "abc123")
		noteID := strings.TrimPrefix(key, "note:")
		noteID = strings.TrimSuffix(noteID, ":data")

		if noteID != "" && noteID != key {
			noteIDs = append(noteIDs, noteID)
		}
	}

	if err := iter.Err(); err != nil {
		return nil, err
	}

	return noteIDs, nil
}

// AcquireSnapshotLock tries to acquire a lock for initializing snapshot
func (nc *NoteCache) AcquireSnapshotLock(ctx context.Context, noteID, clientID string) (bool, error) {
	key := fmt.Sprintf(noteYjsLockKey, noteID)

	// Try to set the lock with NX (only if not exists)
	result, err := nc.client.rdb.SetNX(ctx, key, clientID, noteLockTTL).Result()
	if err != nil {
		return false, err
	}

	return result, nil
}

// ReleaseSnapshotLock releases the snapshot initialization lock
func (nc *NoteCache) ReleaseSnapshotLock(ctx context.Context, noteID, clientID string) error {
	key := fmt.Sprintf(noteYjsLockKey, noteID)

	// Use Lua script to ensure we only delete if we own the lock
	script := `
		if redis.call("get", KEYS[1]) == ARGV[1] then
			return redis.call("del", KEYS[1])
		else
			return 0
		end
	`

	return nc.client.rdb.Eval(ctx, script, []string{key}, clientID).Err()
}

// GetYjsSnapshot retrieves the Y.js snapshot for a note
func (nc *NoteCache) GetYjsSnapshot(ctx context.Context, noteID string) ([]byte, error) {
	key := fmt.Sprintf(noteYjsSnapshotKey, noteID)
	return nc.client.rdb.Get(ctx, key).Bytes()
}

// SetYjsSnapshot stores the Y.js snapshot for a note
func (nc *NoteCache) SetYjsSnapshot(ctx context.Context, noteID string, snapshot []byte) error {
	key := fmt.Sprintf(noteYjsSnapshotKey, noteID)
	return nc.client.rdb.Set(ctx, key, snapshot, noteCacheTTL).Err()
}

// AppendYjsUpdate appends a Y.js update to the list
func (nc *NoteCache) AppendYjsUpdate(ctx context.Context, noteID string, update []byte) error {
	key := fmt.Sprintf(noteYjsUpdatesKey, noteID)

	pipe := nc.client.rdb.Pipeline()
	// Append update to list
	pipe.RPush(ctx, key, update)
	// Set TTL
	pipe.Expire(ctx, key, noteCacheTTL)

	_, err := pipe.Exec(ctx)
	return err
}

// GetYjsUpdates retrieves all Y.js updates for a note
func (nc *NoteCache) GetYjsUpdates(ctx context.Context, noteID string) ([][]byte, error) {
	key := fmt.Sprintf(noteYjsUpdatesKey, noteID)

	results, err := nc.client.rdb.LRange(ctx, key, 0, -1).Result()
	if err != nil {
		return nil, err
	}

	updates := make([][]byte, len(results))
	for i, result := range results {
		updates[i] = []byte(result)
	}

	return updates, nil
}

// ClearYjsUpdates clears all Y.js updates (called after creating new snapshot)
func (nc *NoteCache) ClearYjsUpdates(ctx context.Context, noteID string) error {
	key := fmt.Sprintf(noteYjsUpdatesKey, noteID)
	return nc.client.rdb.Del(ctx, key).Err()
}

// HasYjsSnapshot checks if a snapshot exists for a note
func (nc *NoteCache) HasYjsSnapshot(ctx context.Context, noteID string) (bool, error) {
	key := fmt.Sprintf(noteYjsSnapshotKey, noteID)
	count, err := nc.client.rdb.Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
