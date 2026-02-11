// Redis key patterns (must match Go: internal/redis/note_cache.go)
const NOTE_DATA_KEY = 'note:%s:data';
const NOTE_YJS_SNAPSHOT_KEY = 'note:%s:yjs:snapshot';
const NOTE_YJS_UPDATES_KEY = 'note:%s:yjs:updates';

const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

function key(pattern, id) {
  return pattern.replace('%s', id);
}

export class NoteCache {
  constructor(redis) {
    this.redis = redis;
  }

  async getNoteData(noteID) {
    const k = key(NOTE_DATA_KEY, noteID);
    const result = await this.redis.hgetall(k);
    if (!result || Object.keys(result).length === 0) {
      return null;
    }
    return {
      title: result.title || '',
      content: result.content || '',
      visibility: result.visibility || '',
      created_at: result.created_at || '',
      created_by: result.created_by || '',
      updated_at: result.updated_at || '',
      updated_by: result.updated_by || '',
    };
  }

  async updateNoteTitle(noteID, title, updatedBy) {
    const k = key(NOTE_DATA_KEY, noteID);
    const updatedAt = new Date().toISOString();
    const pipeline = this.redis.pipeline();
    pipeline.hset(k, {
      title,
      updated_at: updatedAt,
      updated_by: updatedBy,
    });
    pipeline.expire(k, CACHE_TTL);
    await pipeline.exec();
  }

  async updateNoteContent(noteID, content, updatedBy) {
    const k = key(NOTE_DATA_KEY, noteID);
    const updatedAt = new Date().toISOString();
    const pipeline = this.redis.pipeline();
    pipeline.hset(k, {
      content,
      updated_at: updatedAt,
      updated_by: updatedBy,
    });
    pipeline.expire(k, CACHE_TTL);
    await pipeline.exec();
  }

  async hasYjsSnapshot(noteID) {
    const k = key(NOTE_YJS_SNAPSHOT_KEY, noteID);
    const count = await this.redis.exists(k);
    return count > 0;
  }

  async getYjsSnapshot(noteID) {
    const k = key(NOTE_YJS_SNAPSHOT_KEY, noteID);
    return await this.redis.getBuffer(k);
  }

  async setYjsSnapshot(noteID, snapshot) {
    const k = key(NOTE_YJS_SNAPSHOT_KEY, noteID);
    await this.redis.set(k, Buffer.from(snapshot), 'EX', CACHE_TTL);
  }

  async appendYjsUpdate(noteID, update) {
    const k = key(NOTE_YJS_UPDATES_KEY, noteID);
    const pipeline = this.redis.pipeline();
    pipeline.rpush(k, Buffer.from(update));
    pipeline.expire(k, CACHE_TTL);
    await pipeline.exec();
  }

  async getYjsUpdates(noteID) {
    const k = key(NOTE_YJS_UPDATES_KEY, noteID);
    const results = await this.redis.lrangeBuffer(k, 0, -1);
    return results || [];
  }

  async clearYjsUpdates(noteID) {
    const k = key(NOTE_YJS_UPDATES_KEY, noteID);
    await this.redis.del(k);
  }

  async getAllActiveNoteIDs() {
    const pattern = 'note:*:data';
    const noteIDs = new Set();
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      for (const k of keys) {
        const id = k.replace(/^note:/, '').replace(/:data$/, '');
        if (id) noteIDs.add(id);
      }
    } while (cursor !== '0');
    return [...noteIDs];
  }

  async refreshTTL(noteID) {
    const dataKey = key(NOTE_DATA_KEY, noteID);
    const snapshotKey = key(NOTE_YJS_SNAPSHOT_KEY, noteID);
    const updatesKey = key(NOTE_YJS_UPDATES_KEY, noteID);
    const pipeline = this.redis.pipeline();
    pipeline.expire(dataKey, CACHE_TTL);
    pipeline.expire(snapshotKey, CACHE_TTL);
    pipeline.expire(updatesKey, CACHE_TTL);
    await pipeline.exec();
  }
}
