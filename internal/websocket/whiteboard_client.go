package websocket

import (
	"time"

	"github.com/gorilla/websocket"
)

// WhiteboardClient represents a WebSocket client for whiteboard views
// It differs from the regular Client by sending text messages (JSON) instead of binary
type WhiteboardClient struct {
	*Client // Embed the regular client
}

// NewWhiteboardClient creates a new whiteboard WebSocket client
func NewWhiteboardClient(conn *websocket.Conn, userID, userName, viewID string, room RoomInterface) *WhiteboardClient {
	client := &Client{
		conn:     conn,
		UserID:   userID,
		UserName: userName,
		ViewID:   viewID,
		send:     make(chan []byte, 256),
		room:     room,
	}
	return &WhiteboardClient{
		Client: client,
	}
}

// writePump pumps messages from the room to the WebSocket connection
// This version sends TEXT messages instead of BINARY messages (for JSON)
func (c *WhiteboardClient) writePump() {
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

			w, err := c.conn.NextWriter(websocket.TextMessage)
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
func (c *WhiteboardClient) Run() {
	go c.writePump()
	go c.readPump()
}
