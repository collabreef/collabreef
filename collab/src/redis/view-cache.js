// Redis key patterns (must match Go: internal/redis/view_cache.go)
const VIEW_YJS_STATE_KEY = 'view:%s:yjs:state';
const VIEW_YJS_UPDATES_KEY = 'view:%s:yjs:updates';

const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds
const MAX_UPDATES = 1000;

function key(pattern, id) {
  return pattern.replace('%s', id);
}

export class ViewCache {
  constructor(redis) {
    this.redis = redis;
  }

  async getViewYjsState(viewID) {
    const k = key(VIEW_YJS_STATE_KEY, viewID);
    const data = await this.redis.getBuffer(k);
    return data;
  }

  async setViewYjsState(viewID, state) {
    const k = key(VIEW_YJS_STATE_KEY, viewID);
    await this.redis.set(k, Buffer.from(state), 'EX', CACHE_TTL);
  }

  async appendViewYjsUpdate(viewID, update) {
    const k = key(VIEW_YJS_UPDATES_KEY, viewID);
    const pipeline = this.redis.pipeline();
    pipeline.rpush(k, Buffer.from(update));
    pipeline.ltrim(k, -MAX_UPDATES, -1);
    pipeline.expire(k, CACHE_TTL);
    await pipeline.exec();
  }

  async getViewYjsUpdates(viewID) {
    const k = key(VIEW_YJS_UPDATES_KEY, viewID);
    const results = await this.redis.lrangeBuffer(k, 0, -1);
    return results || [];
  }

  async clearViewYjsUpdates(viewID) {
    const k = key(VIEW_YJS_UPDATES_KEY, viewID);
    await this.redis.del(k);
  }

  async getAllActiveViewIDs() {
    const pattern = 'view:*:yjs:*';
    const viewIDs = new Set();
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      for (const k of keys) {
        const match = k.match(/^view:([^:]+):yjs:/);
        if (match) viewIDs.add(match[1]);
      }
    } while (cursor !== '0');
    return [...viewIDs];
  }

  async refreshViewTTL(viewID) {
    const stateKey = key(VIEW_YJS_STATE_KEY, viewID);
    const updatesKey = key(VIEW_YJS_UPDATES_KEY, viewID);
    const pipeline = this.redis.pipeline();
    pipeline.expire(stateKey, CACHE_TTL);
    pipeline.expire(updatesKey, CACHE_TTL);
    await pipeline.exec();
  }
}
