package websocket

import (
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer
	pongWait = 60 * time.Second

	// Send pings to peer with this period (must be less than pongWait)
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer
	maxMessageSize = 1024 * 1024 // 1MB
)

// Client represents a WebSocket client
type Client struct {
	// The WebSocket connection
	conn *websocket.Conn

	// User ID
	UserID string

	// User name
	UserName string

	// View ID this client is connected to
	ViewID string

	// Buffered channel of outbound messages
	send chan []byte

	// The room this client belongs to
	room *Room
}

// NewClient creates a new WebSocket client
func NewClient(conn *websocket.Conn, userID, userName, viewID string, room *Room) *Client {
	return &Client{
		conn:     conn,
		UserID:   userID,
		UserName: userName,
		ViewID:   viewID,
		send:     make(chan []byte, 256),
		room:     room,
	}
}

// readPump pumps messages from the WebSocket connection to the room
func (c *Client) readPump() {
	defer func() {
		c.room.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("websocket error: %v", err)
			}
			break
		}

		// Broadcast message to all clients in the room
		c.room.broadcast <- &Message{
			Type:   MessageTypeYjsUpdate,
			Data:   message,
			Sender: c,
		}
	}
}

// writePump pumps messages from the room to the WebSocket connection
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The room closed the channel
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.BinaryMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued messages to the current websocket message
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// Run starts the client's read and write pumps
func (c *Client) Run() {
	go c.writePump()
	go c.readPump()
}
