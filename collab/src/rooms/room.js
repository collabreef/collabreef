// Y.js view room - port of internal/websocket/room.go

export class Room {
  constructor(viewID, viewCache) {
    this.viewID = viewID;
    this.cache = viewCache;
    this.clients = new Set();
    this.stopped = false;
  }

  register(client) {
    this.clients.add(client);
    console.log(`Client ${client.userID} (${client.userName}) joined room ${this.viewID}. Total: ${this.clients.size}`);
    this.sendInitialState(client);
  }

  unregister(client) {
    if (this.clients.has(client)) {
      this.clients.delete(client);
      console.log(`Client ${client.userID} (${client.userName}) left room ${this.viewID}. Remaining: ${this.clients.size}`);
    }
  }

  async sendInitialState(client) {
    try {
      // Send cached Y.js state
      const state = await this.cache.getViewYjsState(this.viewID);
      if (state && state.length > 0) {
        client.send(state);
        console.log(`Sent initial Y.js state to client ${client.userID} (${state.length} bytes)`);
      }

      // Send pending updates
      const updates = await this.cache.getViewYjsUpdates(this.viewID);
      for (const update of updates) {
        client.send(update);
      }
      if (updates.length > 0) {
        console.log(`Sent ${updates.length} pending updates to client ${client.userID}`);
      }
    } catch (err) {
      console.error(`Error sending initial state to client ${client.userID}:`, err.message);
    }
  }

  async handleMessage(sender, data, isBinary) {
    // Store update in Redis
    try {
      await this.cache.appendViewYjsUpdate(this.viewID, data);
    } catch (err) {
      console.error(`Error storing Y.js update in Redis:`, err.message);
    }

    // Broadcast to all clients except sender
    for (const client of this.clients) {
      if (client !== sender) {
        client.send(data);
      }
    }

    // Refresh TTL
    try {
      await this.cache.refreshViewTTL(this.viewID);
    } catch (err) {
      console.error(`Error refreshing TTL:`, err.message);
    }
  }

  clientCount() {
    return this.clients.size;
  }

  stop() {
    this.stopped = true;
    for (const client of this.clients) {
      client.close();
    }
    this.clients.clear();
    console.log(`Room ${this.viewID} stopped`);
  }
}
