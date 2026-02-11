import { createSqliteDB } from './sqlite.js';
import { createPostgresDB } from './postgres.js';

function wrapSync(obj) {
  const wrapped = {};
  for (const [key, fn] of Object.entries(obj)) {
    if (typeof fn === 'function') {
      wrapped[key] = (...args) => {
        try {
          return Promise.resolve(fn(...args));
        } catch (err) {
          return Promise.reject(err);
        }
      };
    }
  }
  return wrapped;
}

export function createDB() {
  const driver = process.env.DB_DRIVER || 'sqlite3';
  const dsn = process.env.DB_DSN || 'bin/collabreef.db';

  if (driver === 'postgres') {
    return createPostgresDB(dsn);
  }

  // Default: sqlite3
  const sqliteDb = createSqliteDB(dsn);
  return wrapSync(sqliteDb);
}
