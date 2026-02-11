import { createRedisClient } from './redis/client.js';
import { ViewCache } from './redis/view-cache.js';
import { NoteCache } from './redis/note-cache.js';
import { WhiteboardCache } from './redis/whiteboard-cache.js';
import { SpreadsheetCache } from './redis/spreadsheet-cache.js';
import { Hub } from './hub.js';
import { createServer } from './server.js';
import { createDB } from './db/db.js';
import { NotePersister } from './persisters/note-persister.js';
import { ViewPersister } from './persisters/view-persister.js';
import { WhiteboardPersister } from './persisters/whiteboard-persister.js';
import { SpreadsheetPersister } from './persisters/spreadsheet-persister.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize Redis
const redis = createRedisClient();

// Initialize caches
const viewCache = new ViewCache(redis);
const noteCache = new NoteCache(redis);
const whiteboardCache = new WhiteboardCache(redis);
const spreadsheetCache = new SpreadsheetCache(redis);

// Initialize Hub
const hub = new Hub({ viewCache, noteCache, whiteboardCache, spreadsheetCache });
console.log('WebSocket Hub initialized');

// Initialize Database
const db = createDB();
console.log(`Database initialized (driver: ${process.env.DB_DRIVER || 'sqlite3'})`);

// Initialize Persisters
const notePersister = new NotePersister(noteCache, db);
const viewPersister = new ViewPersister(viewCache);
const whiteboardPersister = new WhiteboardPersister(whiteboardCache, db);
const spreadsheetPersister = new SpreadsheetPersister(spreadsheetCache, db);

notePersister.start();
viewPersister.start();
whiteboardPersister.start();
spreadsheetPersister.start();

// Create and start server
const server = createServer(hub);

server.listen(PORT, () => {
  console.log(`Collab service listening on port ${PORT}`);
});

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down collab service...');

  // Stop periodic timers
  notePersister.stop();
  viewPersister.stop();
  whiteboardPersister.stop();
  spreadsheetPersister.stop();

  // Force final persist
  console.log('Running final persistence...');
  try {
    await Promise.all([
      notePersister.forcePersist(),
      viewPersister.forcePersist(),
      whiteboardPersister.forcePersist(),
      spreadsheetPersister.forcePersist(),
    ]);
    console.log('Final persistence complete');
  } catch (err) {
    console.error('Error during final persistence:', err.message);
  }

  // Stop hub and server
  hub.stop();
  server.close(async () => {
    console.log('Collab service stopped');
    await db.close();
    redis.disconnect();
    process.exit(0);
  });

  // Force exit after 15 seconds
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 15000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
