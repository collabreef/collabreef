package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

const (
	// Cache key patterns for spreadsheet
	spreadsheetSheetsKey   = "spreadsheet:%s:sheets"
	spreadsheetOpsKey      = "spreadsheet:%s:ops"
	spreadsheetInitLockKey = "spreadsheet:%s:init:lock"

	// TTL for cached data (24 hours)
	spreadsheetCacheTTL = 24 * time.Hour

	// Lock TTL (10 seconds should be enough for initialization)
	spreadsheetInitLockTTL = 10 * time.Second
)

// SpreadsheetCache handles caching of spreadsheet data
type SpreadsheetCache struct {
	client *Client
}

// NewSpreadsheetCache creates a new SpreadsheetCache
func NewSpreadsheetCache(client *Client) *SpreadsheetCache {
	return &SpreadsheetCache{client: client}
}

// GetSheets retrieves all sheets data for a view
func (sc *SpreadsheetCache) GetSheets(ctx context.Context, viewID string) (json.RawMessage, error) {
	key := fmt.Sprintf(spreadsheetSheetsKey, viewID)
	return sc.client.rdb.Get(ctx, key).Bytes()
}

// SetSheets stores sheets data
func (sc *SpreadsheetCache) SetSheets(ctx context.Context, viewID string, sheets json.RawMessage) error {
	key := fmt.Sprintf(spreadsheetSheetsKey, viewID)
	// Convert json.RawMessage to string for Redis storage
	err := sc.client.rdb.Set(ctx, key, string(sheets), spreadsheetCacheTTL).Err()
	if err != nil {
		return err
	}
	// Verify the key was stored
	exists, _ := sc.client.rdb.Exists(ctx, key).Result()
	fmt.Printf("[SpreadsheetCache] SetSheets: key=%s, size=%d bytes, exists=%d\n", key, len(sheets), exists)
	return nil
}

// AppendOps appends operations to the ops list
func (sc *SpreadsheetCache) AppendOps(ctx context.Context, viewID string, ops json.RawMessage) error {
	key := fmt.Sprintf(spreadsheetOpsKey, viewID)
	pipe := sc.client.rdb.Pipeline()
	// Convert json.RawMessage to string for Redis storage
	pipe.RPush(ctx, key, string(ops))
	pipe.Expire(ctx, key, spreadsheetCacheTTL)
	_, err := pipe.Exec(ctx)
	return err
}

// GetAndClearOps retrieves and clears all pending operations
func (sc *SpreadsheetCache) GetAndClearOps(ctx context.Context, viewID string) ([]json.RawMessage, error) {
	key := fmt.Sprintf(spreadsheetOpsKey, viewID)

	// Get all operations
	result, err := sc.client.rdb.LRange(ctx, key, 0, -1).Result()
	if err != nil {
		return nil, err
	}

	// Clear the list
	if len(result) > 0 {
		sc.client.rdb.Del(ctx, key)
	}

	ops := make([]json.RawMessage, len(result))
	for i, r := range result {
		ops[i] = json.RawMessage(r)
	}

	return ops, nil
}

// AcquireSpreadsheetInitLock attempts to acquire an initialization lock for a spreadsheet
func (sc *SpreadsheetCache) AcquireSpreadsheetInitLock(ctx context.Context, viewID string) (bool, error) {
	key := fmt.Sprintf(spreadsheetInitLockKey, viewID)
	result, err := sc.client.rdb.SetNX(ctx, key, "1", spreadsheetInitLockTTL).Result()
	if err != nil {
		return false, err
	}
	return result, nil
}

// ReleaseSpreadsheetInitLock releases the initialization lock
func (sc *SpreadsheetCache) ReleaseSpreadsheetInitLock(ctx context.Context, viewID string) error {
	key := fmt.Sprintf(spreadsheetInitLockKey, viewID)
	return sc.client.rdb.Del(ctx, key).Err()
}

// IsSpreadsheetInitialized checks if a spreadsheet has been initialized in Redis
func (sc *SpreadsheetCache) IsSpreadsheetInitialized(ctx context.Context, viewID string) (bool, error) {
	key := fmt.Sprintf(spreadsheetSheetsKey, viewID)
	exists, err := sc.client.rdb.Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}
	return exists > 0, nil
}

// MarkSpreadsheetInitialized marks a spreadsheet as initialized
func (sc *SpreadsheetCache) MarkSpreadsheetInitialized(ctx context.Context, viewID string) error {
	// The presence of sheets data indicates initialization
	// This method can be used for additional marking if needed
	return nil
}

// RefreshTTL refreshes the TTL for a spreadsheet's cached data
func (sc *SpreadsheetCache) RefreshTTL(ctx context.Context, viewID string) error {
	sheetsKey := fmt.Sprintf(spreadsheetSheetsKey, viewID)
	opsKey := fmt.Sprintf(spreadsheetOpsKey, viewID)

	pipe := sc.client.rdb.Pipeline()
	pipe.Expire(ctx, sheetsKey, spreadsheetCacheTTL)
	pipe.Expire(ctx, opsKey, spreadsheetCacheTTL)

	_, err := pipe.Exec(ctx)
	return err
}

// GetAllActiveSpreadsheetIDs returns all active spreadsheet view IDs
func (sc *SpreadsheetCache) GetAllActiveSpreadsheetIDs(ctx context.Context) ([]string, error) {
	pattern := "spreadsheet:*:sheets"
	var viewIDs []string

	// Use KEYS command for debugging (SCAN is more production-friendly but harder to debug)
	keys, err := sc.client.rdb.Keys(ctx, pattern).Result()
	if err != nil {
		return nil, err
	}

	for _, key := range keys {
		// Extract view ID from key (e.g., "spreadsheet:123:sheets" -> "123")
		viewID := strings.TrimPrefix(key, "spreadsheet:")
		viewID = strings.TrimSuffix(viewID, ":sheets")

		if viewID != "" && viewID != key {
			viewIDs = append(viewIDs, viewID)
		}
	}

	return viewIDs, nil
}
