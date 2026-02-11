import http from 'node:http';
import { WebSocketServer } from 'ws';
import { Client } from './client.js';

export function createServer(hub) {
  const httpServer = http.createServer((req, res) => {
    // Health check
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    // Stats endpoint (non-WebSocket)
    if (req.method === 'GET' && req.url === '/ws/stats') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(hub.stats()));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (req, socket, head) => {
    const parsed = parseRequest(req);
    if (!parsed) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      handleConnection(hub, ws, req, parsed);
    });
  });

  return httpServer;
}

function parseRequest(req) {
  const url = req.url || '';

  // /ws/views/:viewId or /ws/views/:viewId/:viewId (y-websocket duplication)
  let match = url.match(/^\/ws\/views\/([^/?]+)/);
  if (match) {
    return { type: 'view', id: match[1] };
  }

  // /ws/notes/:noteId
  match = url.match(/^\/ws\/notes\/([^/?]+)/);
  if (match) {
    return { type: 'note', id: match[1] };
  }

  // /ws/public/views/:viewId
  match = url.match(/^\/ws\/public\/views\/([^/?]+)/);
  if (match) {
    return { type: 'public_view', id: match[1] };
  }

  return null;
}

function handleConnection(hub, ws, req, parsed) {
  // Read custom headers set by Go reverse proxy
  const userID = req.headers['x-user-id'] || 'anonymous';
  const userName = req.headers['x-user-name'] || 'Anonymous';
  const viewType = req.headers['x-view-type'] || '';
  const isReadOnly = req.headers['x-read-only'] === 'true';

  const { type, id } = parsed;

  if (type === 'note') {
    // Note room - always text messages
    const room = hub.getOrCreateNoteRoom(id);
    const client = new Client(ws, userID, userName, id, room, 'text', isReadOnly);
    room.register(client);
    client.start();
    console.log(`Note WebSocket: user=${userID}, noteId=${id}`);
    return;
  }

  // View or public_view
  const readOnly = isReadOnly || type === 'public_view';

  if (viewType === 'whiteboard') {
    const room = hub.getOrCreateWhiteboardRoom(id);
    const client = new Client(ws, userID, userName, id, room, 'text', readOnly);
    room.register(client);
    client.start();
    console.log(`Whiteboard WebSocket: user=${userID}, viewId=${id}, readOnly=${readOnly}`);
  } else if (viewType === 'spreadsheet') {
    const room = hub.getOrCreateSpreadsheetRoom(id);
    const client = new Client(ws, userID, userName, id, room, 'text', readOnly);
    room.register(client);
    client.start();
    console.log(`Spreadsheet WebSocket: user=${userID}, viewId=${id}, readOnly=${readOnly}`);
  } else {
    // Default Y.js room - binary messages
    const room = hub.getOrCreateRoom(id);
    const client = new Client(ws, userID, userName, id, room, 'binary', readOnly);
    room.register(client);
    client.start();
    console.log(`Y.js View WebSocket: user=${userID}, viewId=${id}, readOnly=${readOnly}`);
  }
}
