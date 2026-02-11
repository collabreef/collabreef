const INTERVAL = 30 * 1000; // 30 seconds

export class SpreadsheetPersister {
  constructor(spreadsheetCache, db) {
    this.cache = spreadsheetCache;
    this.db = db;
    this.timer = null;
  }

  start() {
    this.timer = setInterval(() => this.persistAll(), INTERVAL);
    console.log('Spreadsheet persister started, will run every 30 seconds');
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('Spreadsheet persister stopped');
  }

  async forcePersist() {
    await this.persistAll();
  }

  async persistAll() {
    try {
      const viewIDs = await this.cache.getAllActiveSpreadsheetIDs();
      if (viewIDs.length === 0) return;

      console.log(`Persisting ${viewIDs.length} active spreadsheets to database`);

      let success = 0;
      let errors = 0;

      for (const viewID of viewIDs) {
        try {
          await this.persistSpreadsheet(viewID);
          success++;
        } catch (err) {
          console.error(`Error persisting spreadsheet ${viewID}:`, err.message);
          errors++;
        }
      }

      console.log(`Spreadsheet persistence complete: ${success} succeeded, ${errors} failed`);
    } catch (err) {
      console.error('Error in spreadsheet persistence cycle:', err.message);
    }
  }

  async persistSpreadsheet(viewID) {
    const sheets = await this.cache.getSheets(viewID);
    if (!sheets || sheets.length === 0) return;

    const view = await this.db.findView(viewID);
    if (!view || view.type !== 'spreadsheet') return;

    const now = new Date().toISOString();
    await this.db.updateViewData(viewID, sheets, now);

    console.log(`Persisted spreadsheet ${viewID}`);
  }
}
