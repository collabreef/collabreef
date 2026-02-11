// Hub manages all active rooms - port of internal/websocket/hub.go

import { Room } from './rooms/room.js';
import { NoteRoom } from './rooms/note-room.js';
import { WhiteboardRoom } from './rooms/whiteboard-room.js';
import { SpreadsheetRoom } from './rooms/spreadsheet-room.js';

const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

export class Hub {
  constructor(caches) {
    this.viewCache = caches.viewCache;
    this.whiteboardCache = caches.whiteboardCache;
    this.spreadsheetCache = caches.spreadsheetCache;
    this.noteCache = caches.noteCache;

    // rooms maps viewID -> Room|WhiteboardRoom|SpreadsheetRoom
    this.rooms = new Map();
    // noteRooms maps noteID -> NoteRoom
    this.noteRooms = new Map();

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanupEmptyRooms(), CLEANUP_INTERVAL);
  }

  getOrCreateRoom(viewID) {
    let room = this.rooms.get(viewID);
    if (!room) {
      room = new Room(viewID, this.viewCache);
      this.rooms.set(viewID, room);
      console.log(`Created new Y.js room for view ${viewID}`);
    }
    return room;
  }

  getOrCreateWhiteboardRoom(viewID) {
    let room = this.rooms.get(viewID);
    if (!room) {
      room = new WhiteboardRoom(viewID, this.whiteboardCache);
      this.rooms.set(viewID, room);
      console.log(`Created new whiteboard room for view ${viewID}`);
    }
    return room;
  }

  getOrCreateSpreadsheetRoom(viewID) {
    let room = this.rooms.get(viewID);
    if (!room) {
      room = new SpreadsheetRoom(viewID, this.spreadsheetCache);
      this.rooms.set(viewID, room);
      console.log(`Created new spreadsheet room for view ${viewID}`);
    }
    return room;
  }

  getOrCreateNoteRoom(noteID) {
    let room = this.noteRooms.get(noteID);
    if (!room) {
      room = new NoteRoom(noteID, this.noteCache);
      this.noteRooms.set(noteID, room);
      console.log(`Created new note room for note ${noteID}`);
    }
    return room;
  }

  cleanupEmptyRooms() {
    // Clean up view rooms
    for (const [viewID, room] of this.rooms) {
      if (room.clientCount() === 0) {
        room.stop();
        this.rooms.delete(viewID);
        console.log(`Cleaned up empty room for view ${viewID}`);
      }
    }
    // Clean up note rooms
    for (const [noteID, room] of this.noteRooms) {
      if (room.clientCount() === 0) {
        room.stop();
        this.noteRooms.delete(noteID);
        console.log(`Cleaned up empty note room for note ${noteID}`);
      }
    }
  }

  stats() {
    let totalClients = 0;
    const roomStats = {};

    for (const [viewID, room] of this.rooms) {
      const count = room.clientCount();
      totalClients += count;
      roomStats[viewID] = count;
    }

    for (const [noteID, room] of this.noteRooms) {
      const count = room.clientCount();
      totalClients += count;
      roomStats[`note:${noteID}`] = count;
    }

    return {
      total_rooms: this.rooms.size + this.noteRooms.size,
      total_clients: totalClients,
      rooms: roomStats,
    };
  }

  stop() {
    clearInterval(this.cleanupInterval);

    for (const [viewID, room] of this.rooms) {
      room.stop();
      console.log(`Stopped room for view ${viewID}`);
    }
    for (const [noteID, room] of this.noteRooms) {
      room.stop();
      console.log(`Stopped note room for note ${noteID}`);
    }

    this.rooms.clear();
    this.noteRooms.clear();
  }
}
