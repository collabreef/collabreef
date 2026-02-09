package websocket

import (
	"time"

	"github.com/gorilla/websocket"
)

// SpreadsheetClient represents a WebSocket client for spreadsheet views
// It differs from the regular Client by sending text messages (JSON) instead of binary
type SpreadsheetClient struct {
	*Client // Embed the regular client
}

// NewSpreadsheetClient creates a new spreadsheet WebSocket client
func NewSpreadsheetClient(conn *websocket.Conn, userID, userName, viewID string, room RoomInterface) *SpreadsheetClient {
	client := &Client{
		conn:     conn,
		UserID:   userID,
		UserName: userName,
		ViewID:   viewID,
		send:     make(chan []byte, 256),
		room:     room,
	}
	return &SpreadsheetClient{
		Client: client,
	}
}

// writePump pumps messages from the room to the WebSocket connection
// This version sends TEXT messages instead of BINARY messages (for JSON)
func (c *SpreadsheetClient) writePump() {
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
func (c *SpreadsheetClient) Run() {
	go c.writePump()
	go c.readPump()
}
