const INTERVAL = 30 * 1000; // 30 seconds

export class WhiteboardPersister {
  constructor(whiteboardCache, db) {
    this.cache = whiteboardCache;
    this.db = db;
    this.timer = null;
  }

  start() {
    this.timer = setInterval(() => this.persistAll(), INTERVAL);
    console.log('Whiteboard persister started, will run every 30 seconds');
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('Whiteboard persister stopped');
  }

  async forcePersist() {
    await this.persistAll();
  }

  async persistAll() {
    try {
      const viewIDs = await this.cache.getAllActiveWhiteboardIDs();
      if (viewIDs.length === 0) return;

      console.log(`Persisting ${viewIDs.length} active whiteboards to database`);

      let success = 0;
      let errors = 0;

      for (const viewID of viewIDs) {
        try {
          await this.persistWhiteboard(viewID);
          success++;
        } catch (err) {
          console.error(`Error persisting whiteboard ${viewID}:`, err.message);
          errors++;
        }
      }

      console.log(`Whiteboard persistence complete: ${success} succeeded, ${errors} failed`);
    } catch (err) {
      console.error('Error in whiteboard persistence cycle:', err.message);
    }
  }

  async persistWhiteboard(viewID) {
    const canvasObjects = await this.cache.getCanvasObjects(viewID);
    const viewObjects = await this.cache.getViewObjects(viewID);

    // Remove _initialized markers
    delete canvasObjects['_initialized'];
    delete viewObjects['_initialized'];

    // Find view in DB
    const view = await this.db.findView(viewID);
    if (!view || view.type !== 'whiteboard') return;

    const now = new Date().toISOString();

    // Update view.data with canvas objects
    const canvasData = JSON.stringify(canvasObjects);
    await this.db.updateViewData(viewID, canvasData, now);

    // Sync view_objects: compare Redis vs DB
    const dbViewObjects = await this.db.findViewObjectsByViewId(viewID);
    const redisObjectIDs = new Set(Object.keys(viewObjects));

    // Delete objects in DB but not in Redis
    let deletedCount = 0;
    for (const dbObj of dbViewObjects) {
      if (!redisObjectIDs.has(dbObj.id)) {
        try {
          await this.db.deleteViewObject(dbObj.id);
          deletedCount++;
        } catch (err) {
          console.error(`Warning: failed to delete view object ${dbObj.id}:`, err.message);
        }
      }
    }
    if (deletedCount > 0) {
      console.log(`Deleted ${deletedCount} stale view objects from whiteboard ${viewID}`);
    }

    // Create or update objects from Redis
    for (const [objId, obj] of Object.entries(viewObjects)) {
      const existing = await this.db.findViewObject(objId);
      const dataStr = typeof obj.data === 'string' ? obj.data : JSON.stringify(obj.data);

      if (!existing) {
        try {
          await this.db.createViewObject({
            id: objId,
            view_id: viewID,
            name: obj.name || '',
            type: obj.type || '',
            data: dataStr,
            created_by: view.created_by,
            updated_by: view.updated_by,
            created_at: now,
            updated_at: now,
          });
        } catch (err) {
          console.error(`Warning: failed to create view object ${objId}:`, err.message);
        }
      } else {
        try {
          await this.db.updateViewObject(objId, {
            name: obj.name || '',
            type: obj.type || '',
            data: dataStr,
            updated_by: view.updated_by,
            updated_at: now,
          });
        } catch (err) {
          console.error(`Warning: failed to update view object ${objId}:`, err.message);
        }
      }
    }

    console.log(
      `Persisted whiteboard ${viewID} (canvas: ${Object.keys(canvasObjects).length}, view objects: ${Object.keys(viewObjects).length})`
    );
  }
}
