// Redis key patterns (must match Go: internal/redis/whiteboard_cache.go + whiteboard_lock.go)
const WB_CANVAS_KEY = 'whiteboard:%s:canvas';
const WB_VIEW_OBJECTS_KEY = 'whiteboard:%s:viewobjects';
const WB_YJS_STATE_KEY = 'whiteboard:%s:yjsstate';
const WB_INIT_LOCK_KEY = 'whiteboard:%s:init:lock';

const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds
const INIT_LOCK_TTL = 10; // 10 seconds

function key(pattern, id) {
  return pattern.replace('%s', id);
}

export class WhiteboardCache {
  constructor(redis) {
    this.redis = redis;
  }

  // Canvas objects
  async getCanvasObjects(viewID) {
    const k = key(WB_CANVAS_KEY, viewID);
    const result = await this.redis.hgetall(k);
    const objects = {};
    for (const [id, data] of Object.entries(result)) {
      try {
        objects[id] = JSON.parse(data);
      } catch {
        // skip invalid entries
      }
    }
    return objects;
  }

  async setCanvasObject(viewID, obj) {
    const k = key(WB_CANVAS_KEY, viewID);
    const pipeline = this.redis.pipeline();
    pipeline.hset(k, obj.id, JSON.stringify(obj));
    pipeline.expire(k, CACHE_TTL);
    await pipeline.exec();
  }

  async deleteCanvasObject(viewID, objectID) {
    const k = key(WB_CANVAS_KEY, viewID);
    await this.redis.hdel(k, objectID);
  }

  async clearCanvasObjects(viewID) {
    const k = key(WB_CANVAS_KEY, viewID);
    const fields = await this.redis.hkeys(k);
    if (fields.length > 0) {
      await this.redis.hdel(k, ...fields);
    }
  }

  // View objects
  async getViewObjects(viewID) {
    const k = key(WB_VIEW_OBJECTS_KEY, viewID);
    const result = await this.redis.hgetall(k);
    const objects = {};
    for (const [id, data] of Object.entries(result)) {
      try {
        objects[id] = JSON.parse(data);
      } catch {
        // skip invalid entries
      }
    }
    return objects;
  }

  async setViewObject(viewID, obj) {
    const k = key(WB_VIEW_OBJECTS_KEY, viewID);
    const pipeline = this.redis.pipeline();
    pipeline.hset(k, obj.id, JSON.stringify(obj));
    pipeline.expire(k, CACHE_TTL);
    await pipeline.exec();
  }

  async deleteViewObject(viewID, objectID) {
    const k = key(WB_VIEW_OBJECTS_KEY, viewID);
    await this.redis.hdel(k, objectID);
  }

  async clearViewObjects(viewID) {
    const k = key(WB_VIEW_OBJECTS_KEY, viewID);
    const fields = await this.redis.hkeys(k);
    if (fields.length > 0) {
      await this.redis.hdel(k, ...fields);
    }
  }

  // Y.js state
  async getYjsState(viewID) {
    const k = key(WB_YJS_STATE_KEY, viewID);
    return await this.redis.getBuffer(k);
  }

  async setYjsState(viewID, state) {
    const k = key(WB_YJS_STATE_KEY, viewID);
    await this.redis.set(k, Buffer.from(state), 'EX', CACHE_TTL);
  }

  // Initialization lock
  async acquireInitLock(viewID) {
    const k = key(WB_INIT_LOCK_KEY, viewID);
    const result = await this.redis.set(k, '1', 'NX', 'EX', INIT_LOCK_TTL);
    return result === 'OK';
  }

  async releaseInitLock(viewID) {
    const k = key(WB_INIT_LOCK_KEY, viewID);
    await this.redis.del(k);
  }

  async isInitialized(viewID) {
    const canvasKey = key(WB_CANVAS_KEY, viewID);
    const viewObjKey = key(WB_VIEW_OBJECTS_KEY, viewID);
    const [canvasExists, viewObjExists] = await Promise.all([
      this.redis.exists(canvasKey),
      this.redis.exists(viewObjKey),
    ]);
    return canvasExists > 0 || viewObjExists > 0;
  }

  async markInitialized(viewID) {
    const canvasKey = key(WB_CANVAS_KEY, viewID);
    const viewObjKey = key(WB_VIEW_OBJECTS_KEY, viewID);
    const pipeline = this.redis.pipeline();
    pipeline.hsetnx(canvasKey, '_initialized', '1');
    pipeline.expire(canvasKey, CACHE_TTL);
    pipeline.hsetnx(viewObjKey, '_initialized', '1');
    pipeline.expire(viewObjKey, CACHE_TTL);
    await pipeline.exec();
  }

  async getAllActiveWhiteboardIDs() {
    const pattern = 'whiteboard:*:canvas';
    const viewIDs = new Set();
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      for (const k of keys) {
        const id = k.replace(/^whiteboard:/, '').replace(/:canvas$/, '');
        if (id) viewIDs.add(id);
      }
    } while (cursor !== '0');
    return [...viewIDs];
  }

  // TTL refresh
  async refreshTTL(viewID) {
    const canvasKey = key(WB_CANVAS_KEY, viewID);
    const viewObjKey = key(WB_VIEW_OBJECTS_KEY, viewID);
    const yjsKey = key(WB_YJS_STATE_KEY, viewID);
    const pipeline = this.redis.pipeline();
    pipeline.expire(canvasKey, CACHE_TTL);
    pipeline.expire(viewObjKey, CACHE_TTL);
    pipeline.expire(yjsKey, CACHE_TTL);
    await pipeline.exec();
  }
}
