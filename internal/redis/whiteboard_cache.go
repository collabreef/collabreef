package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

const (
	// Cache key patterns for whiteboard
	whiteboardCanvasKey      = "whiteboard:%s:canvas"
	whiteboardViewObjectsKey = "whiteboard:%s:viewobjects"
	whiteboardYjsStateKey    = "whiteboard:%s:yjsstate"

	// TTL for cached data (24 hours)
	whiteboardCacheTTL = 24 * time.Hour
)

// WhiteboardCache handles caching of whiteboard data
type WhiteboardCache struct {
	client *Client
}

// NewWhiteboardCache creates a new WhiteboardCache
func NewWhiteboardCache(client *Client) *WhiteboardCache {
	return &WhiteboardCache{client: client}
}

// CanvasObject represents a drawable object on the canvas
type CanvasObject struct {
	ID   string          `json:"id"`
	Type string          `json:"type"` // "stroke" or "shape"
	Data json.RawMessage `json:"data"`
}

// ViewObject represents a view object (text, note, view reference)
type ViewObject struct {
	ID   string          `json:"id"`
	Type string          `json:"type"`
	Name string          `json:"name"`
	Data json.RawMessage `json:"data"`
}

// GetCanvasObjects retrieves all canvas objects for a view
func (wc *WhiteboardCache) GetCanvasObjects(ctx context.Context, viewID string) (map[string]CanvasObject, error) {
	key := fmt.Sprintf(whiteboardCanvasKey, viewID)

	// Get all fields from hash
	result, err := wc.client.rdb.HGetAll(ctx, key).Result()
	if err != nil {
		return nil, err
	}

	objects := make(map[string]CanvasObject)
	for id, data := range result {
		var obj CanvasObject
		if err := json.Unmarshal([]byte(data), &obj); err != nil {
			continue
		}
		objects[id] = obj
	}

	return objects, nil
}

// SetCanvasObject stores a single canvas object
func (wc *WhiteboardCache) SetCanvasObject(ctx context.Context, viewID string, obj CanvasObject) error {
	key := fmt.Sprintf(whiteboardCanvasKey, viewID)

	data, err := json.Marshal(obj)
	if err != nil {
		return err
	}

	pipe := wc.client.rdb.Pipeline()
	pipe.HSet(ctx, key, obj.ID, data)
	pipe.Expire(ctx, key, whiteboardCacheTTL)

	_, err = pipe.Exec(ctx)
	return err
}

// DeleteCanvasObject deletes a canvas object
func (wc *WhiteboardCache) DeleteCanvasObject(ctx context.Context, viewID, objectID string) error {
	key := fmt.Sprintf(whiteboardCanvasKey, viewID)
	return wc.client.rdb.HDel(ctx, key, objectID).Err()
}

// ClearCanvasObjects clears all canvas objects
func (wc *WhiteboardCache) ClearCanvasObjects(ctx context.Context, viewID string) error {
	key := fmt.Sprintf(whiteboardCanvasKey, viewID)

	// Get all field names in the hash
	fields, err := wc.client.rdb.HKeys(ctx, key).Result()
	if err != nil {
		return err
	}

	// If there are no fields, nothing to clear
	if len(fields) == 0 {
		return nil
	}

	// Delete all fields from the hash, but keep the key itself
	return wc.client.rdb.HDel(ctx, key, fields...).Err()
}

// GetViewObjects retrieves all view objects for a view
func (wc *WhiteboardCache) GetViewObjects(ctx context.Context, viewID string) (map[string]ViewObject, error) {
	key := fmt.Sprintf(whiteboardViewObjectsKey, viewID)

	// Get all fields from hash
	result, err := wc.client.rdb.HGetAll(ctx, key).Result()
	if err != nil {
		return nil, err
	}

	objects := make(map[string]ViewObject)
	for id, data := range result {
		var obj ViewObject
		if err := json.Unmarshal([]byte(data), &obj); err != nil {
			continue
		}
		objects[id] = obj
	}

	return objects, nil
}

// SetViewObject stores a single view object
func (wc *WhiteboardCache) SetViewObject(ctx context.Context, viewID string, obj ViewObject) error {
	key := fmt.Sprintf(whiteboardViewObjectsKey, viewID)

	data, err := json.Marshal(obj)
	if err != nil {
		return err
	}

	pipe := wc.client.rdb.Pipeline()
	pipe.HSet(ctx, key, obj.ID, data)
	pipe.Expire(ctx, key, whiteboardCacheTTL)

	_, err = pipe.Exec(ctx)
	return err
}

// DeleteViewObject deletes a view object
func (wc *WhiteboardCache) DeleteViewObject(ctx context.Context, viewID, objectID string) error {
	key := fmt.Sprintf(whiteboardViewObjectsKey, viewID)
	return wc.client.rdb.HDel(ctx, key, objectID).Err()
}

// ClearViewObjects clears all view objects
func (wc *WhiteboardCache) ClearViewObjects(ctx context.Context, viewID string) error {
	key := fmt.Sprintf(whiteboardViewObjectsKey, viewID)

	// Get all field names in the hash
	fields, err := wc.client.rdb.HKeys(ctx, key).Result()
	if err != nil {
		return err
	}

	// If there are no fields, nothing to clear
	if len(fields) == 0 {
		return nil
	}

	// Delete all fields from the hash, but keep the key itself
	return wc.client.rdb.HDel(ctx, key, fields...).Err()
}

// GetYjsState retrieves the Y.js CRDT state for a whiteboard
func (wc *WhiteboardCache) GetYjsState(ctx context.Context, viewID string) ([]byte, error) {
	key := fmt.Sprintf(whiteboardYjsStateKey, viewID)
	return wc.client.rdb.Get(ctx, key).Bytes()
}

// SetYjsState stores the Y.js CRDT state for a whiteboard
func (wc *WhiteboardCache) SetYjsState(ctx context.Context, viewID string, state []byte) error {
	key := fmt.Sprintf(whiteboardYjsStateKey, viewID)
	return wc.client.rdb.Set(ctx, key, state, whiteboardCacheTTL).Err()
}

// RefreshTTL refreshes the TTL for a whiteboard's cached data
func (wc *WhiteboardCache) RefreshTTL(ctx context.Context, viewID string) error {
	canvasKey := fmt.Sprintf(whiteboardCanvasKey, viewID)
	viewObjectsKey := fmt.Sprintf(whiteboardViewObjectsKey, viewID)
	yjsStateKey := fmt.Sprintf(whiteboardYjsStateKey, viewID)

	pipe := wc.client.rdb.Pipeline()
	pipe.Expire(ctx, canvasKey, whiteboardCacheTTL)
	pipe.Expire(ctx, viewObjectsKey, whiteboardCacheTTL)
	pipe.Expire(ctx, yjsStateKey, whiteboardCacheTTL)

	_, err := pipe.Exec(ctx)
	return err
}

// GetAllActiveWhiteboardIDs returns all active whiteboard view IDs
func (wc *WhiteboardCache) GetAllActiveWhiteboardIDs(ctx context.Context) ([]string, error) {
	pattern := "whiteboard:*:canvas"
	var viewIDs []string

	iter := wc.client.rdb.Scan(ctx, 0, pattern, 0).Iterator()
	for iter.Next(ctx) {
		key := iter.Val()
		// Extract view ID from key (e.g., "whiteboard:123:canvas" -> "123")
		// Remove prefix and suffix
		viewID := strings.TrimPrefix(key, "whiteboard:")
		viewID = strings.TrimSuffix(viewID, ":canvas")

		if viewID != "" && viewID != key {
			viewIDs = append(viewIDs, viewID)
		}
	}

	if err := iter.Err(); err != nil {
		return nil, err
	}

	return viewIDs, nil
}
