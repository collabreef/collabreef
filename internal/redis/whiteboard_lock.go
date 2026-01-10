package redis

import (
	"context"
	"fmt"
	"time"
)

const (
	// Lock key pattern for whiteboard initialization
	whiteboardInitLockKey = "whiteboard:%s:init:lock"

	// Lock TTL (10 seconds should be enough for initialization)
	initLockTTL = 10 * time.Second
)

// AcquireWhiteboardInitLock attempts to acquire an initialization lock for a whiteboard
// Returns true if lock was acquired, false if another client holds the lock
func (wc *WhiteboardCache) AcquireWhiteboardInitLock(ctx context.Context, viewID string) (bool, error) {
	key := fmt.Sprintf(whiteboardInitLockKey, viewID)

	// Use SET with NX (only set if not exists) and EX (expiration)
	result, err := wc.client.rdb.SetNX(ctx, key, "1", initLockTTL).Result()
	if err != nil {
		return false, err
	}

	return result, nil
}

// ReleaseWhiteboardInitLock releases the initialization lock
func (wc *WhiteboardCache) ReleaseWhiteboardInitLock(ctx context.Context, viewID string) error {
	key := fmt.Sprintf(whiteboardInitLockKey, viewID)
	return wc.client.rdb.Del(ctx, key).Err()
}

// IsWhiteboardInitialized checks if a whiteboard has been initialized in Redis
func (wc *WhiteboardCache) IsWhiteboardInitialized(ctx context.Context, viewID string) (bool, error) {
	canvasKey := fmt.Sprintf(whiteboardCanvasKey, viewID)
	viewObjectsKey := fmt.Sprintf(whiteboardViewObjectsKey, viewID)

	// Check if either key exists
	canvasExists, err := wc.client.rdb.Exists(ctx, canvasKey).Result()
	if err != nil {
		return false, err
	}

	viewObjExists, err := wc.client.rdb.Exists(ctx, viewObjectsKey).Result()
	if err != nil {
		return false, err
	}

	return canvasExists > 0 || viewObjExists > 0, nil
}

// MarkWhiteboardInitialized marks a whiteboard as initialized (creates empty keys if needed)
func (wc *WhiteboardCache) MarkWhiteboardInitialized(ctx context.Context, viewID string) error {
	canvasKey := fmt.Sprintf(whiteboardCanvasKey, viewID)
	viewObjectsKey := fmt.Sprintf(whiteboardViewObjectsKey, viewID)

	pipe := wc.client.rdb.Pipeline()

	// Create keys with empty hashes and set TTL
	// Using HSETNX to only create if doesn't exist
	pipe.HSetNX(ctx, canvasKey, "_initialized", "1")
	pipe.Expire(ctx, canvasKey, whiteboardCacheTTL)
	pipe.HSetNX(ctx, viewObjectsKey, "_initialized", "1")
	pipe.Expire(ctx, viewObjectsKey, whiteboardCacheTTL)

	_, err := pipe.Exec(ctx)
	return err
}
