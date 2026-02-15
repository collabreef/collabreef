import pg from 'pg';
const { Pool } = pg;

function parseDSN(dsn) {
  const params = {};
  dsn.split(/\s+/).forEach((part) => {
    const idx = part.indexOf('=');
    if (idx > 0) {
      params[part.substring(0, idx)] = part.substring(idx + 1);
    }
  });
  return {
    host: params.host || 'localhost',
    port: parseInt(params.port || '5432'),
    user: params.user,
    password: params.password,
    database: params.dbname,
    ssl: params.sslmode === 'require' ? true : false,
    max: 5,
  };
}

export function createPostgresDB(dsn) {
  const pool = new Pool(parseDSN(dsn));

  return {
    async findNote(id) {
      const { rows } = await pool.query('SELECT * FROM notes WHERE id = $1', [id]);
      return rows[0] || null;
    },
    async updateNote(id, { title, content, updated_at, updated_by }) {
      await pool.query(
        'UPDATE notes SET title = $1, content = $2, updated_at = $3, updated_by = $4 WHERE id = $5',
        [title, content, updated_at, updated_by, id]
      );
    },
    async findView(id) {
      const { rows } = await pool.query('SELECT * FROM views WHERE id = $1', [id]);
      return rows[0] || null;
    },
    async updateViewData(id, data, updated_at) {
      await pool.query('UPDATE views SET data = $1, updated_at = $2 WHERE id = $3', [
        data,
        updated_at,
        id,
      ]);
    },
    async findViewObjectsByViewId(viewId) {
      const { rows } = await pool.query('SELECT * FROM view_objects WHERE view_id = $1', [viewId]);
      return rows;
    },
    async findViewObject(id) {
      const { rows } = await pool.query('SELECT * FROM view_objects WHERE id = $1', [id]);
      return rows[0] || null;
    },
    async createViewObject({ id, view_id, name, type, data, created_by, updated_by, created_at, updated_at }) {
      await pool.query(
        'INSERT INTO view_objects (id, view_id, name, type, data, created_by, updated_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [id, view_id, name, type, data, created_by, updated_by, created_at, updated_at]
      );
    },
    async updateViewObject(id, { name, type, data, updated_by, updated_at }) {
      await pool.query(
        'UPDATE view_objects SET name = $1, type = $2, data = $3, updated_by = $4, updated_at = $5 WHERE id = $6',
        [name, type, data, updated_by, updated_at, id]
      );
    },
    async deleteViewObject(id) {
      await pool.query('DELETE FROM view_objects WHERE id = $1', [id]);
    },
    async getYjsDocument(name) {
      const { rows } = await pool.query('SELECT * FROM yjs_documents WHERE name = $1', [name]);
      return rows[0] || null;
    },
    async saveYjsDocument(name, data, updated_at) {
      await pool.query(
        'INSERT INTO yjs_documents (name, data, updated_at) VALUES ($1, $2, $3) ON CONFLICT(name) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at',
        [name, data, updated_at]
      );
    },
    async close() {
      await pool.end();
    },
  };
}
