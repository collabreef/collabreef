package websocket

// RoomInterface defines the interface that all room types must implement
type RoomInterface interface {
	Run()
	Stop()
	ClientCount() int
	Register(*Client)
	Unregister(*Client)
	Broadcast(*Message)
}
