import * as Y from 'yjs';

const INTERVAL = 5 * 60 * 1000; // 5 minutes

export class ViewPersister {
  constructor(viewCache) {
    this.cache = viewCache;
    this.timer = null;
  }

  start() {
    this.timer = setInterval(() => this.persistAll(), INTERVAL);
    console.log('View persister started, will run every 5 minutes');
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('View persister stopped');
  }

  async forcePersist() {
    await this.persistAll();
  }

  async persistAll() {
    try {
      const viewIDs = await this.cache.getAllActiveViewIDs();
      if (viewIDs.length === 0) return;

      console.log(`Merging Y.js state for ${viewIDs.length} active views`);

      let success = 0;
      let errors = 0;

      for (const viewID of viewIDs) {
        try {
          await this.persistView(viewID);
          success++;
        } catch (err) {
          console.error(`Error merging view ${viewID}:`, err.message);
          errors++;
        }
      }

      console.log(`View persistence complete: ${success} succeeded, ${errors} failed`);
    } catch (err) {
      console.error('Error in view persistence cycle:', err.message);
    }
  }

  async persistView(viewID) {
    const state = await this.cache.getViewYjsState(viewID);
    const updates = await this.cache.getViewYjsUpdates(viewID);

    if ((!state || state.length === 0) && updates.length === 0) return;

    // Proper Y.js merge
    const doc = new Y.Doc();

    if (state && state.length > 0) {
      Y.applyUpdate(doc, state);
    }

    for (const update of updates) {
      Y.applyUpdate(doc, update);
    }

    const mergedState = Y.encodeStateAsUpdate(doc);
    doc.destroy();

    // Save merged state back to Redis and clear updates
    await this.cache.setViewYjsState(viewID, Buffer.from(mergedState));
    await this.cache.clearViewYjsUpdates(viewID);

    console.log(`Merged Y.js state for view ${viewID} (${mergedState.length} bytes, ${updates.length} updates merged)`);
  }
}
