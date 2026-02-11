// Whiteboard collaboration room - port of internal/websocket/whiteboard_room.go + whiteboard_init.go

export class WhiteboardRoom {
  constructor(viewID, whiteboardCache) {
    this.viewID = viewID;
    this.cache = whiteboardCache;
    this.clients = new Set();
    this.stopped = false;
  }

  register(client) {
    this.clients.add(client);
    console.log(`Client ${client.userID} (${client.userName}) joined whiteboard room ${this.viewID}. Total: ${this.clients.size}`);
    this.sendInitialState(client);
  }

  unregister(client) {
    if (this.clients.has(client)) {
      this.clients.delete(client);
      console.log(`Client ${client.userID} (${client.userName}) left whiteboard room ${this.viewID}. Remaining: ${this.clients.size}`);
    }
  }

  async sendInitialState(client) {
    try {
      const initialized = await this.cache.isInitialized(this.viewID);

      let canvasObjects = {};
      let viewObjects = {};
      let yjsState = null;

      if (initialized) {
        canvasObjects = await this.cache.getCanvasObjects(this.viewID);
        viewObjects = await this.cache.getViewObjects(this.viewID);
        yjsState = await this.cache.getYjsState(this.viewID);
      }

      // Remove _initialized markers
      delete canvasObjects['_initialized'];
      delete viewObjects['_initialized'];

      const initMsg = {
        type: 'init',
        canvas_objects: canvasObjects,
        view_objects: viewObjects,
        initialized,
        yjs_state: yjsState ? Array.from(yjsState) : null,
      };

      client.send(JSON.stringify(initMsg));
      console.log(`Sent initial state to client ${client.userID} (initialized=${initialized}, ${Object.keys(canvasObjects).length} canvas, ${Object.keys(viewObjects).length} view objects)`);
    } catch (err) {
      console.error(`Error sending initial state to client ${client.userID}:`, err.message);
    }
  }

  async handleMessage(sender, data) {
    let msgStr;
    if (Buffer.isBuffer(data)) {
      msgStr = data.toString('utf8');
    } else {
      msgStr = data.toString();
    }

    let msg;
    try {
      msg = JSON.parse(msgStr);
    } catch (err) {
      console.error(`Error parsing whiteboard message:`, err.message);
      return;
    }

    // Ignore write operations from read-only clients
    if (sender.isReadOnly && msg.type !== 'acquire_lock') {
      return;
    }

    switch (msg.type) {
      case 'acquire_lock': {
        let acquired = false;
        try {
          acquired = await this.cache.acquireInitLock(this.viewID);
        } catch (err) {
          console.error(`Error acquiring init lock:`, err.message);
        }

        const response = JSON.stringify({
          type: 'lock_acquired',
          lock_acquired: acquired,
        });
        sender.send(response);
        console.log(`Sent lock response to client ${sender.userID}: ${acquired}`);
        return; // Don't broadcast lock responses
      }

      case 'initialize_data': {
        // Store canvas objects
        if (msg.canvas_objects) {
          for (const [id, obj] of Object.entries(msg.canvas_objects)) {
            obj.id = id;
            try { await this.cache.setCanvasObject(this.viewID, obj); } catch (err) {
              console.error(`Error storing canvas object:`, err.message);
            }
          }
        }

        // Store view objects
        if (msg.view_objects) {
          for (const [id, obj] of Object.entries(msg.view_objects)) {
            obj.id = id;
            try { await this.cache.setViewObject(this.viewID, obj); } catch (err) {
              console.error(`Error storing view object:`, err.message);
            }
          }
        }

        // Store Y.js state
        if (msg.yjs_state && msg.yjs_state.length > 0) {
          try {
            await this.cache.setYjsState(this.viewID, Buffer.from(msg.yjs_state));
          } catch (err) {
            console.error(`Error storing Y.js state:`, err.message);
          }
        }

        // Mark initialized and release lock
        try { await this.cache.markInitialized(this.viewID); } catch (err) {
          console.error(`Error marking initialized:`, err.message);
        }
        try { await this.cache.releaseInitLock(this.viewID); } catch (err) {
          console.error(`Error releasing lock:`, err.message);
        }

        console.log(`Whiteboard ${this.viewID} initialized by client ${sender.userID}`);

        // Broadcast to other clients
        for (const client of this.clients) {
          if (client !== sender) {
            client.send(msgStr);
          }
        }
        break;
      }

      case 'add_canvas_object':
      case 'update_canvas_object': {
        if (msg.object) {
          try { await this.cache.setCanvasObject(this.viewID, msg.object); } catch (err) {
            console.error(`Error storing canvas object:`, err.message);
          }
        }
        break;
      }

      case 'delete_canvas_object': {
        if (msg.id) {
          try { await this.cache.deleteCanvasObject(this.viewID, msg.id); } catch (err) {
            console.error(`Error deleting canvas object:`, err.message);
          }
        }
        break;
      }

      case 'add_view_object':
      case 'update_view_object': {
        if (msg.object) {
          try { await this.cache.setViewObject(this.viewID, msg.object); } catch (err) {
            console.error(`Error storing view object:`, err.message);
          }
        }
        break;
      }

      case 'delete_view_object': {
        if (msg.id) {
          try { await this.cache.deleteViewObject(this.viewID, msg.id); } catch (err) {
            console.error(`Error deleting view object:`, err.message);
          }
        }
        break;
      }

      case 'clear_all': {
        try { await this.cache.clearCanvasObjects(this.viewID); } catch (err) {
          console.error(`Error clearing canvas:`, err.message);
        }
        try { await this.cache.clearViewObjects(this.viewID); } catch (err) {
          console.error(`Error clearing view objects:`, err.message);
        }
        try { await this.cache.markInitialized(this.viewID); } catch (err) {
          console.error(`Error re-marking initialized:`, err.message);
        }
        console.log(`Cleared all objects from whiteboard ${this.viewID}`);
        break;
      }
    }

    // Broadcast to all clients except sender (for non-lock messages)
    if (msg.type !== 'acquire_lock') {
      for (const client of this.clients) {
        if (client !== sender) {
          client.send(msgStr);
        }
      }
    }

    // Refresh TTL
    try {
      await this.cache.refreshTTL(this.viewID);
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
    console.log(`Whiteboard room ${this.viewID} stopped`);
  }
}
