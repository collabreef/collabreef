import { WebSocket } from 'ws';

const PING_INTERVAL = 54 * 1000; // 54 seconds (must be less than pongWait)
const PONG_TIMEOUT = 60 * 1000; // 60 seconds

export class Client {
  /**
   * @param {WebSocket} ws
   * @param {string} userID
   * @param {string} userName
   * @param {string} roomID
   * @param {object} room
   * @param {'text'|'binary'} messageType
   * @param {boolean} isReadOnly
   */
  constructor(ws, userID, userName, roomID, room, messageType = 'binary', isReadOnly = false) {
    this.ws = ws;
    this.userID = userID;
    this.userName = userName;
    this.roomID = roomID;
    this.room = room;
    this.messageType = messageType;
    this.isReadOnly = isReadOnly;
    this.alive = true;
    this.pingInterval = null;
  }

  start() {
    // Setup pong handler
    this.ws.on('pong', () => {
      this.alive = true;
    });

    // Setup ping interval
    this.pingInterval = setInterval(() => {
      if (!this.alive) {
        this.ws.terminate();
        return;
      }
      this.alive = false;
      this.ws.ping();
    }, PING_INTERVAL);

    // Handle incoming messages
    this.ws.on('message', (data, isBinary) => {
      if (this.isReadOnly) {
        return;
      }
      this.room.handleMessage(this, data, isBinary);
    });

    // Handle close
    this.ws.on('close', () => {
      this.cleanup();
      this.room.unregister(this);
    });

    // Handle error
    this.ws.on('error', (err) => {
      console.error(`WebSocket error for client ${this.userID}:`, err.message);
    });
  }

  send(data) {
    if (this.ws.readyState === WebSocket.OPEN) {
      try {
        if (this.messageType === 'text') {
          this.ws.send(typeof data === 'string' ? data : data.toString(), { binary: false });
        } else {
          this.ws.send(data, { binary: true });
        }
      } catch (err) {
        console.error(`Error sending to client ${this.userID}:`, err.message);
      }
    }
  }

  cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  close() {
    this.cleanup();
    if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
      this.ws.close();
    }
  }
}
