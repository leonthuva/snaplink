const db = require('./database');

const run = (sql, params) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) reject(err);
    else resolve(this);
  });
});

const get = (sql, params) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

const all = (sql, params) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

function parseBookmark(row) {
  if (!row) return null;
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : []
  };
}

const Bookmark = {
  create: async ({ url, title, summary, tags, category }) => {
    const tagsJson = tags ? JSON.stringify(tags) : '[]';
    const result = await run(
      `INSERT INTO bookmarks (url, title, summary, tags, category) VALUES (?, ?, ?, ?, ?)`,
      [url, title || null, summary || null, tagsJson, category || null]
    );
    return Bookmark.getById(result.lastID);
  },

  getAll: async ({ category, tag, search, limit = 50, offset = 0 }) => {
    let sql = 'SELECT * FROM bookmarks WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (tag) {
      sql += ' AND tags LIKE ?';
      params.push(`%${tag}%`);
    }

    if (search) {
      sql += ' AND (title LIKE ? OR url LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const rows = await all(sql, params);
    return rows.map(parseBookmark);
  },

  getById: async (id) => {
    const row = await get('SELECT * FROM bookmarks WHERE id = ?', [id]);
    return parseBookmark(row);
  },

  update: async (id, { url, title, summary, tags, category }) => {
    const bookmark = await Bookmark.getById(id);
    if (!bookmark) return null;

    const updates = [];
    const params = [];

    if (url !== undefined) {
      updates.push('url = ?');
      params.push(url);
    }
    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (summary !== undefined) {
      updates.push('summary = ?');
      params.push(summary);
    }
    if (tags !== undefined) {
      updates.push('tags = ?');
      params.push(JSON.stringify(tags));
    }
    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
    }

    if (updates.length === 0) return bookmark;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await run(`UPDATE bookmarks SET ${updates.join(', ')} WHERE id = ?`, params);
    return Bookmark.getById(id);
  },

  delete: async (id) => {
    const result = await run('DELETE FROM bookmarks WHERE id = ?', [id]);
    return result.changes > 0;
  }
};

module.exports = Bookmark;