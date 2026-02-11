// Redis key patterns (must match Go: internal/redis/spreadsheet_cache.go)
const SS_SHEETS_KEY = 'spreadsheet:%s:sheets';
const SS_OPS_KEY = 'spreadsheet:%s:ops';
const SS_INIT_LOCK_KEY = 'spreadsheet:%s:init:lock';

const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds
const INIT_LOCK_TTL = 10; // 10 seconds

function key(pattern, id) {
  return pattern.replace('%s', id);
}

export class SpreadsheetCache {
  constructor(redis) {
    this.redis = redis;
  }

  async getSheets(viewID) {
    const k = key(SS_SHEETS_KEY, viewID);
    const data = await this.redis.get(k);
    return data;
  }

  async setSheets(viewID, sheets) {
    const k = key(SS_SHEETS_KEY, viewID);
    const value = typeof sheets === 'string' ? sheets : JSON.stringify(sheets);
    await this.redis.set(k, value, 'EX', CACHE_TTL);
  }

  async appendOps(viewID, ops) {
    const k = key(SS_OPS_KEY, viewID);
    const value = typeof ops === 'string' ? ops : JSON.stringify(ops);
    const pipeline = this.redis.pipeline();
    pipeline.rpush(k, value);
    pipeline.expire(k, CACHE_TTL);
    await pipeline.exec();
  }

  async acquireInitLock(viewID) {
    const k = key(SS_INIT_LOCK_KEY, viewID);
    const result = await this.redis.set(k, '1', 'NX', 'EX', INIT_LOCK_TTL);
    return result === 'OK';
  }

  async releaseInitLock(viewID) {
    const k = key(SS_INIT_LOCK_KEY, viewID);
    await this.redis.del(k);
  }

  async isInitialized(viewID) {
    const k = key(SS_SHEETS_KEY, viewID);
    const exists = await this.redis.exists(k);
    return exists > 0;
  }

  async getAllActiveSpreadsheetIDs() {
    const pattern = 'spreadsheet:*:sheets';
    const viewIDs = new Set();
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      for (const k of keys) {
        const id = k.replace(/^spreadsheet:/, '').replace(/:sheets$/, '');
        if (id) viewIDs.add(id);
      }
    } while (cursor !== '0');
    return [...viewIDs];
  }

  async refreshTTL(viewID) {
    const sheetsKey = key(SS_SHEETS_KEY, viewID);
    const opsKey = key(SS_OPS_KEY, viewID);
    const pipeline = this.redis.pipeline();
    pipeline.expire(sheetsKey, CACHE_TTL);
    pipeline.expire(opsKey, CACHE_TTL);
    await pipeline.exec();
  }
}
