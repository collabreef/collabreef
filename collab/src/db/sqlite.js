import Database from 'better-sqlite3';

export function createSqliteDB(dsn) {
  const db = new Database(dsn);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');

  const stmts = {
    findNote: db.prepare('SELECT * FROM notes WHERE id = ?'),
    updateNote: db.prepare(
      'UPDATE notes SET title = ?, content = ?, updated_at = ?, updated_by = ? WHERE id = ?'
    ),
    findView: db.prepare('SELECT * FROM views WHERE id = ?'),
    updateViewData: db.prepare('UPDATE views SET data = ?, updated_at = ? WHERE id = ?'),
    findViewObjectsByViewId: db.prepare('SELECT * FROM view_objects WHERE view_id = ?'),
    findViewObject: db.prepare('SELECT * FROM view_objects WHERE id = ?'),
    createViewObject: db.prepare(
      'INSERT INTO view_objects (id, view_id, name, type, data, created_by, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ),
    updateViewObject: db.prepare(
      'UPDATE view_objects SET name = ?, type = ?, data = ?, updated_by = ?, updated_at = ? WHERE id = ?'
    ),
    deleteViewObject: db.prepare('DELETE FROM view_objects WHERE id = ?'),
    getYjsDocument: db.prepare('SELECT * FROM yjs_documents WHERE name = ?'),
    upsertYjsDocument: db.prepare(
      'INSERT INTO yjs_documents (name, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(name) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at'
    ),
  };

  return {
    findNote(id) {
      return stmts.findNote.get(id) || null;
    },
    updateNote(id, { title, content, updated_at, updated_by }) {
      stmts.updateNote.run(title, content, updated_at, updated_by, id);
    },
    findView(id) {
      return stmts.findView.get(id) || null;
    },
    updateViewData(id, data, updated_at) {
      stmts.updateViewData.run(data, updated_at, id);
    },
    findViewObjectsByViewId(viewId) {
      return stmts.findViewObjectsByViewId.all(viewId);
    },
    findViewObject(id) {
      return stmts.findViewObject.get(id) || null;
    },
    createViewObject({ id, view_id, name, type, data, created_by, updated_by, created_at, updated_at }) {
      stmts.createViewObject.run(id, view_id, name, type, data, created_by, updated_by, created_at, updated_at);
    },
    updateViewObject(id, { name, type, data, updated_by, updated_at }) {
      stmts.updateViewObject.run(name, type, data, updated_by, updated_at, id);
    },
    deleteViewObject(id) {
      stmts.deleteViewObject.run(id);
    },
    getYjsDocument(name) {
      return stmts.getYjsDocument.get(name) || null;
    },
    saveYjsDocument(name, data, updated_at) {
      stmts.upsertYjsDocument.run(name, data, updated_at);
    },
    close() {
      db.close();
    },
  };
}
