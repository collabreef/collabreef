// Note collaboration room - port of internal/websocket/note_room.go + note_init.go

export class NoteRoom {
  constructor(noteID, noteCache) {
    this.noteID = noteID;
    this.cache = noteCache;
    this.clients = new Set();
    this.stopped = false;
  }

  register(client) {
    this.clients.add(client);
    console.log(`Client ${client.userID} (${client.userName}) joined note room ${this.noteID}. Total: ${this.clients.size}`);
    this.sendInitialState(client);
    this.broadcastUserJoin(client);
  }

  unregister(client) {
    if (this.clients.has(client)) {
      this.clients.delete(client);
      console.log(`Client ${client.userID} (${client.userName}) left note room ${this.noteID}. Remaining: ${this.clients.size}`);
      this.broadcastUserLeave(client);
    }
  }

  async sendInitialState(client) {
    try {
      const activeUsers = this.getActiveUsers();

      // Load note data from Redis cache (pre-warmed by Go handler)
      const noteData = await this.cache.getNoteData(this.noteID);

      let title = '';
      let content = '';
      let visibility = '';
      let createdAt = '';
      let createdBy = '';
      let updatedAt = '';
      let updatedBy = '';

      if (noteData) {
        title = noteData.title;
        content = noteData.content;
        visibility = noteData.visibility;
        createdAt = noteData.created_at;
        createdBy = noteData.created_by;
        updatedAt = noteData.updated_at;
        updatedBy = noteData.updated_by;
        console.log(`Note ${this.noteID} data loaded from Redis cache`);
      } else {
        console.log(`Note ${this.noteID} data not found in Redis cache`);
      }

      // Check if Y.js snapshot exists
      const hasSnapshot = await this.cache.hasYjsSnapshot(this.noteID);
      const needInitialize = !hasSnapshot;

      // Send init message
      const initMsg = {
        type: 'init',
        id: this.noteID,
        title,
        content,
        visibility,
        created_at: createdAt,
        created_by: createdBy,
        updated_at: updatedAt,
        updated_by: updatedBy,
        users: activeUsers,
        need_initialize: needInitialize,
      };

      client.send(JSON.stringify(initMsg));
      console.log(`Sent initial note state to client ${client.userID} (title=${title}, content_length=${content.length}, need_init=${needInitialize})`);

      // If snapshot exists, send snapshot + updates
      if (hasSnapshot) {
        const snapshot = await this.cache.getYjsSnapshot(this.noteID);
        if (snapshot && snapshot.length > 0) {
          const snapshotMsg = {
            type: 'snapshot',
            snapshot: Array.from(snapshot),
          };
          client.send(JSON.stringify(snapshotMsg));
          console.log(`Sent Y.js snapshot to client ${client.userID} (${snapshot.length} bytes)`);
        }

        // Send pending updates
        const updates = await this.cache.getYjsUpdates(this.noteID);
        for (let i = 0; i < updates.length; i++) {
          const updateMsg = {
            type: 'yjs_update',
            yjs_update: Array.from(updates[i]),
          };
          client.send(JSON.stringify(updateMsg));
        }
        if (updates.length > 0) {
          console.log(`Sent ${updates.length} Y.js updates to client ${client.userID}`);
        }

        // Send snapshot ready
        client.send(JSON.stringify({ type: 'snapshot_ready' }));
        console.log(`Sent snapshot ready to client ${client.userID}`);
      }
    } catch (err) {
      console.error(`Error sending initial state to client ${client.userID}:`, err.message);
    }
  }

  async handleMessage(sender, data) {
    let msgStr;
    if (Buffer.isBuffer(data)) {
      msgStr = data.toString('utf8');
    } else if (data instanceof ArrayBuffer) {
      msgStr = Buffer.from(data).toString('utf8');
    } else {
      msgStr = data.toString();
    }

    let noteMsg;
    try {
      noteMsg = JSON.parse(msgStr);
    } catch {
      console.warn(`[NoteRoom] Received non-JSON message, size: ${data.length} bytes`);
      return;
    }

    switch (noteMsg.type) {
      case 'update_title':
        try {
          await this.cache.updateNoteTitle(this.noteID, noteMsg.title, sender.userID);
          console.log(`Updated note ${this.noteID} title by user ${sender.userID}`);
        } catch (err) {
          console.error(`Error updating note title:`, err.message);
        }
        break;

      case 'update_content':
        try {
          await this.cache.updateNoteContent(this.noteID, noteMsg.content, sender.userID);
        } catch (err) {
          console.error(`Error updating note content:`, err.message);
        }
        break;

      case 'snapshot':
        if (noteMsg.snapshot) {
          try {
            const snapshotBuf = Buffer.from(noteMsg.snapshot);
            await this.cache.setYjsSnapshot(this.noteID, snapshotBuf);
            console.log(`Stored Y.js snapshot for note ${this.noteID} (${snapshotBuf.length} bytes)`);
          } catch (err) {
            console.error(`Error storing Y.js snapshot:`, err.message);
          }
        }
        // Don't broadcast snapshot messages
        return;

      case 'yjs_update':
        if (noteMsg.yjs_update) {
          try {
            const updateBuf = Buffer.from(noteMsg.yjs_update);
            await this.cache.appendYjsUpdate(this.noteID, updateBuf);
          } catch (err) {
            console.error(`Error appending Y.js update:`, err.message);
          }

          if (noteMsg.content) {
            try {
              await this.cache.updateNoteContent(this.noteID, noteMsg.content, sender.userID);
            } catch (err) {
              console.error(`Error updating note content:`, err.message);
            }
          }
        }
        break;
    }

    // Broadcast to all clients except sender
    const rawData = typeof data === 'string' ? data : msgStr;
    for (const client of this.clients) {
      if (client !== sender) {
        client.send(rawData);
      }
    }

    // Refresh TTL
    try {
      await this.cache.refreshTTL(this.noteID);
    } catch (err) {
      console.error(`Error refreshing TTL:`, err.message);
    }
  }

  broadcastUserJoin(joinedClient) {
    const msg = JSON.stringify({
      type: 'user_join',
      user: { id: joinedClient.userID, name: joinedClient.userName },
    });
    for (const client of this.clients) {
      if (client !== joinedClient) {
        client.send(msg);
      }
    }
  }

  broadcastUserLeave(leftClient) {
    const msg = JSON.stringify({
      type: 'user_leave',
      user: { id: leftClient.userID, name: leftClient.userName },
    });
    for (const client of this.clients) {
      client.send(msg);
    }
  }

  getActiveUsers() {
    const users = [];
    for (const client of this.clients) {
      users.push({ id: client.userID, name: client.userName });
    }
    return users;
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
    console.log(`Note room ${this.noteID} stopped`);
  }
}
