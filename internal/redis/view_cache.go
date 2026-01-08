package redis

import (
	"context"
	"fmt"
	"time"
)

const (
	// Cache key patterns
	viewYjsStateKey       = "view:%s:yjs:state"
	viewYjsUpdatesKey     = "view:%s:yjs:updates"
	viewObjectYjsStateKey = "viewobject:%s:yjs:state"

	// TTL for cached data (24 hours)
	cacheTTL = 24 * time.Hour

	// Maximum number of updates to keep in the list
	maxUpdates = 1000
)

// ViewCache handles caching of view Y.js states
type ViewCache struct {
	client *Client
}

// NewViewCache creates a new ViewCache
func NewViewCache(client *Client) *ViewCache {
	return &ViewCache{client: client}
}

// SetViewYjsState stores the Y.js state for a view
func (vc *ViewCache) SetViewYjsState(ctx context.Context, viewID string, state []byte) error {
	key := fmt.Sprintf(viewYjsStateKey, viewID)
	return vc.client.rdb.Set(ctx, key, state, cacheTTL).Err()
}

// GetViewYjsState retrieves the Y.js state for a view
func (vc *ViewCache) GetViewYjsState(ctx context.Context, viewID string) ([]byte, error) {
	key := fmt.Sprintf(viewYjsStateKey, viewID)
	data, err := vc.client.rdb.Get(ctx, key).Bytes()
	if err != nil {
		return nil, err
	}
	return data, nil
}

// AppendViewYjsUpdate appends a Y.js update to the list
func (vc *ViewCache) AppendViewYjsUpdate(ctx context.Context, viewID string, update []byte) error {
	key := fmt.Sprintf(viewYjsUpdatesKey, viewID)

	// Use a pipeline to append and trim in one go
	pipe := vc.client.rdb.Pipeline()
	pipe.RPush(ctx, key, update)
	pipe.LTrim(ctx, key, -maxUpdates, -1) // Keep only the last maxUpdates items
	pipe.Expire(ctx, key, cacheTTL)

	_, err := pipe.Exec(ctx)
	return err
}

// GetViewYjsUpdates retrieves all Y.js updates for a view
func (vc *ViewCache) GetViewYjsUpdates(ctx context.Context, viewID string) ([][]byte, error) {
	key := fmt.Sprintf(viewYjsUpdatesKey, viewID)

	// Get all updates
	updates, err := vc.client.rdb.LRange(ctx, key, 0, -1).Result()
	if err != nil {
		return nil, err
	}

	// Convert string slice to byte slice slice
	result := make([][]byte, len(updates))
	for i, update := range updates {
		result[i] = []byte(update)
	}

	return result, nil
}

// ClearViewYjsUpdates clears all Y.js updates for a view (after persisting)
func (vc *ViewCache) ClearViewYjsUpdates(ctx context.Context, viewID string) error {
	key := fmt.Sprintf(viewYjsUpdatesKey, viewID)
	return vc.client.rdb.Del(ctx, key).Err()
}

// SetViewObjectYjsState stores the Y.js state for a view object
func (vc *ViewCache) SetViewObjectYjsState(ctx context.Context, objectID string, state []byte) error {
	key := fmt.Sprintf(viewObjectYjsStateKey, objectID)
	return vc.client.rdb.Set(ctx, key, state, cacheTTL).Err()
}

// GetViewObjectYjsState retrieves the Y.js state for a view object
func (vc *ViewCache) GetViewObjectYjsState(ctx context.Context, objectID string) ([]byte, error) {
	key := fmt.Sprintf(viewObjectYjsStateKey, objectID)
	data, err := vc.client.rdb.Get(ctx, key).Bytes()
	if err != nil {
		return nil, err
	}
	return data, nil
}

// GetAllActiveViewIDs returns all active view IDs (views that have cached data)
func (vc *ViewCache) GetAllActiveViewIDs(ctx context.Context) ([]string, error) {
	// Scan for all view keys
	pattern := "view:*:yjs:*"
	var viewIDs []string

	iter := vc.client.rdb.Scan(ctx, 0, pattern, 0).Iterator()
	for iter.Next(ctx) {
		key := iter.Val()
		// Extract view ID from key (e.g., "view:123:yjs:state" -> "123")
		var viewID string
		_, err := fmt.Sscanf(key, "view:%s:yjs:", &viewID)
		if err == nil && viewID != "" {
			// Remove duplicates
			found := false
			for _, id := range viewIDs {
				if id == viewID {
					found = true
					break
				}
			}
			if !found {
				viewIDs = append(viewIDs, viewID)
			}
		}
	}

	if err := iter.Err(); err != nil {
		return nil, err
	}

	return viewIDs, nil
}

// RefreshViewTTL refreshes the TTL for a view's cached data
func (vc *ViewCache) RefreshViewTTL(ctx context.Context, viewID string) error {
	stateKey := fmt.Sprintf(viewYjsStateKey, viewID)
	updatesKey := fmt.Sprintf(viewYjsUpdatesKey, viewID)

	pipe := vc.client.rdb.Pipeline()
	pipe.Expire(ctx, stateKey, cacheTTL)
	pipe.Expire(ctx, updatesKey, cacheTTL)

	_, err := pipe.Exec(ctx)
	return err
}
