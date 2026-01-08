package redis

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// Client wraps the Redis client
type Client struct {
	rdb *redis.Client
}

// Config holds Redis configuration
type Config struct {
	Addr     string
	Password string
	DB       int
}

// NewClient creates a new Redis client
func NewClient(config Config) (*Client, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:     config.Addr,
		Password: config.Password,
		DB:       config.DB,
		PoolSize: 10,
		MinIdleConns: 5,
		MaxRetries: 3,
		DialTimeout: 5 * time.Second,
		ReadTimeout: 3 * time.Second,
		WriteTimeout: 3 * time.Second,
	})

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return &Client{rdb: rdb}, nil
}

// Close closes the Redis connection
func (c *Client) Close() error {
	return c.rdb.Close()
}

// Ping checks if Redis is alive
func (c *Client) Ping(ctx context.Context) error {
	return c.rdb.Ping(ctx).Err()
}

// GetClient returns the underlying Redis client
func (c *Client) GetClient() *redis.Client {
	return c.rdb
}
