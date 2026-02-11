import * as Y from 'yjs';

const INTERVAL = 30 * 1000; // 30 seconds

export class NotePersister {
  constructor(noteCache, db) {
    this.cache = noteCache;
    this.db = db;
    this.timer = null;
  }

  start() {
    this.timer = setInterval(() => this.persistAll(), INTERVAL);
    console.log('Note persister started, will run every 30 seconds');
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('Note persister stopped');
  }

  async forcePersist() {
    await this.persistAll();
  }

  async persistAll() {
    try {
      const noteIDs = await this.cache.getAllActiveNoteIDs();
      if (noteIDs.length === 0) return;

      console.log(`Persisting ${noteIDs.length} active notes to database`);

      let success = 0;
      let errors = 0;

      for (const noteID of noteIDs) {
        try {
          await this.persistNote(noteID);
          success++;
        } catch (err) {
          console.error(`Error persisting note ${noteID}:`, err.message);
          errors++;
        }
      }

      console.log(`Note persistence complete: ${success} succeeded, ${errors} failed`);
    } catch (err) {
      console.error('Error in note persistence cycle:', err.message);
    }
  }

  async persistNote(noteID) {
    // Get note metadata from Redis hash
    const noteData = await this.cache.getNoteData(noteID);
    if (!noteData) return;

    // Try Y.js replay to get authoritative content
    let content = noteData.content; // fallback to plain text from hash

    const snapshot = await this.cache.getYjsSnapshot(noteID);
    const updates = await this.cache.getYjsUpdates(noteID);

    if ((snapshot && snapshot.length > 0) || updates.length > 0) {
      try {
        const doc = new Y.Doc();

        if (snapshot && snapshot.length > 0) {
          Y.applyUpdate(doc, snapshot);
        }

        for (const update of updates) {
          Y.applyUpdate(doc, update);
        }

        // Extract content from Y.js shared type (frontend uses getText('content'))
        content = doc.getText('content').toString();

        // Compact: save merged state as new snapshot, clear updates
        const mergedState = Y.encodeStateAsUpdate(doc);
        await this.cache.setYjsSnapshot(noteID, Buffer.from(mergedState));
        await this.cache.clearYjsUpdates(noteID);

        doc.destroy();
      } catch (yjsErr) {
        console.error(`Y.js replay failed for note ${noteID}, using plain content:`, yjsErr.message);
      }
    }

    // Find note in DB
    const note = await this.db.findNote(noteID);
    if (!note) {
      console.log(`Note ${noteID} not found in database, skipping`);
      return;
    }

    // Update note in DB
    await this.db.updateNote(noteID, {
      title: noteData.title,
      content,
      updated_at: noteData.updated_at,
      updated_by: noteData.updated_by,
    });

    console.log(`Persisted note ${noteID} (title: ${noteData.title}, content length: ${content.length})`);
  }
}
