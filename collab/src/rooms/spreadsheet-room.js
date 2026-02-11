// Spreadsheet collaboration room - port of internal/websocket/spreadsheet_room.go

export class SpreadsheetRoom {
  constructor(viewID, spreadsheetCache) {
    this.viewID = viewID;
    this.cache = spreadsheetCache;
    this.clients = new Set();
    this.stopped = false;
  }

  register(client) {
    this.clients.add(client);
    console.log(`Client ${client.userID} (${client.userName}) joined spreadsheet room ${this.viewID}. Total: ${this.clients.size}`);
    this.sendInitialState(client);
  }

  unregister(client) {
    if (this.clients.has(client)) {
      this.clients.delete(client);
      console.log(`Client ${client.userID} (${client.userName}) left spreadsheet room ${this.viewID}. Remaining: ${this.clients.size}`);
    }
  }

  async sendInitialState(client) {
    try {
      const initialized = await this.cache.isInitialized(this.viewID);
      let sheets = null;

      if (initialized) {
        sheets = await this.cache.getSheets(this.viewID);
      }

      const initMsg = {
        type: 'init',
        sheets: sheets ? JSON.parse(sheets) : null,
        initialized,
      };

      client.send(JSON.stringify(initMsg));
      console.log(`Sent initial state to client ${client.userID} (initialized=${initialized})`);
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
      console.error(`Error parsing spreadsheet message:`, err.message);
      return;
    }

    // Ignore write operations from read-only clients
    if (sender.isReadOnly && msg.type !== 'acquire_lock') {
      return;
    }

    switch (msg.type) {
      case 'acquire_lock': {
        // Check if already initialized first
        let acquired = false;
        try {
          const alreadyInit = await this.cache.isInitialized(this.viewID);
          if (alreadyInit) {
            acquired = false;
          } else {
            acquired = await this.cache.acquireInitLock(this.viewID);
          }
        } catch (err) {
          console.error(`Error acquiring init lock:`, err.message);
        }

        const response = JSON.stringify({
          type: 'lock_acquired',
          lock_acquired: acquired,
        });
        sender.send(response);
        console.log(`Sent lock response to client ${sender.userID}: ${acquired}`);
        return;
      }

      case 'initialize_data': {
        if (msg.sheets) {
          try {
            const sheetsStr = typeof msg.sheets === 'string' ? msg.sheets : JSON.stringify(msg.sheets);
            await this.cache.setSheets(this.viewID, sheetsStr);
            console.log(`Stored initial sheets for spreadsheet ${this.viewID}`);
          } catch (err) {
            console.error(`Error storing sheets:`, err.message);
          }
        }

        try { await this.cache.releaseInitLock(this.viewID); } catch (err) {
          console.error(`Error releasing init lock:`, err.message);
        }

        console.log(`Spreadsheet ${this.viewID} initialized by client ${sender.userID}`);

        // Broadcast to other clients
        for (const client of this.clients) {
          if (client !== sender) {
            client.send(msgStr);
          }
        }
        break;
      }

      case 'op': {
        // Store ops
        if (msg.ops) {
          try {
            await this.cache.appendOps(this.viewID, msg.ops);
          } catch (err) {
            console.error(`Error appending ops:`, err.message);
          }
        }

        // Store updated sheets
        if (msg.sheets) {
          try {
            const sheetsStr = typeof msg.sheets === 'string' ? msg.sheets : JSON.stringify(msg.sheets);
            await this.cache.setSheets(this.viewID, sheetsStr);
          } catch (err) {
            console.error(`Error storing sheets:`, err.message);
          }
        }

        // Broadcast to ALL clients (each filters by session_id)
        const broadcastMsg = JSON.stringify({
          type: 'op',
          ops: msg.ops,
          sheets: msg.sheets,
          session_id: msg.session_id,
        });

        for (const client of this.clients) {
          client.send(broadcastMsg);
        }
        console.log(`Broadcasted op to ${this.clients.size} clients (session: ${msg.session_id})`);
        break;
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
    console.log(`Spreadsheet room ${this.viewID} stopped`);
  }
}
