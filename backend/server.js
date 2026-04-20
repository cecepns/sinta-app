const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysqlCore = require('mysql2');
const mysql = require('mysql2/promise');
require('dotenv').config();

const PORT = Number(process.env.PORT) || 4000;
const MAX_PAGE_SIZE = 20;
/** Folder khusus penyimpanan gambar menu & sub menu */
const UPLOAD_FOLDER_NAME = 'uploads-inventory-sinta';
const UPLOAD_DIR = path.join(__dirname, UPLOAD_FOLDER_NAME);

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function publicImageUrl(imagePath) {
  if (!imagePath) return null;
  return `/${UPLOAD_FOLDER_NAME}/${path.basename(imagePath)}`;
}

function storedImageRel(filename) {
  return path.join(UPLOAD_FOLDER_NAME, filename);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME || 'sinta_inventory',
  waitForConnections: true,
  connectionLimit: 10,
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error('Hanya gambar JPEG, PNG, GIF, atau WebP'));
  },
});

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(`/${UPLOAD_FOLDER_NAME}`, express.static(UPLOAD_DIR));

function parsePagination(query) {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
  let limit = parseInt(String(query.limit || String(MAX_PAGE_SIZE)), 10) || MAX_PAGE_SIZE;
  limit = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function searchClause(search, column) {
  if (!search || !String(search).trim()) return { sql: '', params: [] };
  return { sql: ` AND ${column} LIKE ? `, params: [`%${String(search).trim()}%`] };
}

function toSqlDateTime(value) {
  return value.toISOString().slice(0, 19).replace('T', ' ');
}

function sqlValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (value instanceof Date) return mysqlCore.escape(toSqlDateTime(value));
  if (Buffer.isBuffer(value)) return `X'${value.toString('hex')}'`;
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'object') return mysqlCore.escape(JSON.stringify(value));
  return mysqlCore.escape(String(value));
}

async function buildDatabaseDump() {
  const conn = await pool.getConnection();
  try {
    const tables = ['menus', 'sub_menus', 'inventory_items', 'activities'];
    const lines = [
      '-- SINTA inventory database backup',
      `-- Generated at ${new Date().toISOString()}`,
      '',
      'SET NAMES utf8mb4;',
      'SET FOREIGN_KEY_CHECKS=0;',
      'START TRANSACTION;',
      '',
    ];

    for (const table of tables) {
      const [[createResult]] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
      const createSql = createResult?.['Create Table'];
      if (!createSql) continue;
      lines.push(`-- Table structure for \`${table}\``);
      lines.push(`DROP TABLE IF EXISTS \`${table}\`;`);
      lines.push(`${createSql};`);
      lines.push('');
    }

    for (const table of tables) {
      const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
      lines.push(`-- Data for \`${table}\``);
      if (!rows.length) {
        lines.push(`-- No rows in \`${table}\``);
        lines.push('');
        continue;
      }
      const columns = Object.keys(rows[0]);
      const colList = columns.map((c) => `\`${c}\``).join(', ');
      const valueRows = rows.map((row) => `(${columns.map((c) => sqlValue(row[c])).join(', ')})`);
      lines.push(`INSERT INTO \`${table}\` (${colList}) VALUES`);
      lines.push(`${valueRows.join(',\n')};`);
      lines.push('');
    }

    lines.push('COMMIT;');
    lines.push('SET FOREIGN_KEY_CHECKS=1;');
    lines.push('');
    return lines.join('\n');
  } finally {
    conn.release();
  }
}

async function logActivity(conn, { actor_name, action, entity_type, entity_id, summary }) {
  const actor = String(actor_name || '').trim() || 'Anonim';
  await conn.execute(
    `INSERT INTO activities (actor_name, action, entity_type, entity_id, summary) VALUES (?,?,?,?,?)`,
    [actor, action, entity_type, entity_id ?? null, summary.slice(0, 512)]
  );
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/database/download', async (_req, res) => {
  try {
    const dump = await buildDatabaseDump();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="sinta-inventory-backup-${stamp}.sql"`);
    res.send(dump);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Gagal membuat backup database' });
  }
});

/** Menus */
app.get('/api/menus', async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { sql: sSql, params: sParams } = searchClause(req.query.search, 'name');
    const [[{ total: t }]] = await pool.query(`SELECT COUNT(*) AS total FROM menus WHERE 1=1 ${sSql}`, sParams);
    const total = Number(t);
    const [rows] = await pool.query(
      `SELECT id, name, image_path, created_at, updated_at FROM menus WHERE 1=1 ${sSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...sParams, limit, offset]
    );
    res.json({
      data: rows.map((r) => ({ ...r, image_url: publicImageUrl(r.image_path) })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/menus', upload.single('image'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const name = String(req.body.name || '').trim();
    const actor_name = req.body.actor_name;
    if (!name) return res.status(400).json({ error: 'Nama menu wajib diisi' });
    const image_path = req.file ? storedImageRel(req.file.filename) : null;
    const [r] = await conn.execute(`INSERT INTO menus (name, image_path) VALUES (?,?)`, [name, image_path]);
    const id = r.insertId;
    await logActivity(conn, {
      actor_name,
      action: 'create',
      entity_type: 'menu',
      entity_id: id,
      summary: `Menambah menu: ${name}`,
    });
    res.status(201).json({ id, name, image_path, image_url: req.file ? publicImageUrl(storedImageRel(req.file.filename)) : null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

app.put('/api/menus/:id', upload.single('image'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = parseInt(req.params.id, 10);
    const name = String(req.body.name || '').trim();
    const actor_name = req.body.actor_name;
    if (!id || !name) return res.status(400).json({ error: 'ID dan nama wajib' });
    const [[existing]] = await conn.query(`SELECT id, image_path FROM menus WHERE id=?`, [id]);
    if (!existing) return res.status(404).json({ error: 'Menu tidak ditemukan' });
    let image_path = existing.image_path;
    if (req.file) {
      if (existing.image_path) {
        const oldAbs = path.join(__dirname, existing.image_path);
        fs.unlink(oldAbs, () => {});
      }
      image_path = storedImageRel(req.file.filename);
    }
    await conn.execute(`UPDATE menus SET name=?, image_path=? WHERE id=?`, [name, image_path, id]);
    await logActivity(conn, {
      actor_name,
      action: 'update',
      entity_type: 'menu',
      entity_id: id,
      summary: `Mengubah menu #${id}: ${name}`,
    });
    res.json({ id, name, image_path, image_url: publicImageUrl(image_path) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

app.delete('/api/menus/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = parseInt(req.params.id, 10);
    const actor_name = req.body?.actor_name ?? req.query.actor_name;
    if (!id) return res.status(400).json({ error: 'ID tidak valid' });
    const [[row]] = await conn.query(`SELECT name, image_path FROM menus WHERE id=?`, [id]);
    if (!row) return res.status(404).json({ error: 'Menu tidak ditemukan' });
    await conn.execute(`DELETE FROM menus WHERE id=?`, [id]);
    if (row.image_path) fs.unlink(path.join(__dirname, row.image_path), () => {});
    await logActivity(conn, {
      actor_name,
      action: 'delete',
      entity_type: 'menu',
      entity_id: id,
      summary: `Menghapus menu: ${row.name}`,
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

/** Sub menus */
app.get('/api/menus/:menuId/sub-menus', async (req, res) => {
  try {
    const menuId = parseInt(req.params.menuId, 10);
    if (!menuId) return res.status(400).json({ error: 'menuId tidak valid' });
    const { page, limit, offset } = parsePagination(req.query);
    const { sql: sSql, params: sParams } = searchClause(req.query.search, 's.name');
    const [[{ total: t }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM sub_menus s WHERE s.menu_id=? ${sSql}`,
      [menuId, ...sParams]
    );
    const total = Number(t);
    const [rows] = await pool.query(
      `SELECT s.id, s.menu_id, s.name, s.image_path, s.created_at, s.updated_at
       FROM sub_menus s WHERE s.menu_id=? ${sSql} ORDER BY s.id DESC LIMIT ? OFFSET ?`,
      [menuId, ...sParams, limit, offset]
    );
    res.json({
      data: rows.map((r) => ({ ...r, image_url: publicImageUrl(r.image_path) })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/menus/:menuId/sub-menus', upload.single('image'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const menuId = parseInt(req.params.menuId, 10);
    const name = String(req.body.name || '').trim();
    const actor_name = req.body.actor_name;
    if (!menuId || !name) return res.status(400).json({ error: 'Menu dan nama sub menu wajib' });
    const [[m]] = await conn.query(`SELECT id FROM menus WHERE id=?`, [menuId]);
    if (!m) return res.status(404).json({ error: 'Menu tidak ditemukan' });
    const image_path = req.file ? storedImageRel(req.file.filename) : null;
    const [r] = await conn.execute(`INSERT INTO sub_menus (menu_id, name, image_path) VALUES (?,?,?)`, [menuId, name, image_path]);
    const id = r.insertId;
    await logActivity(conn, {
      actor_name,
      action: 'create',
      entity_type: 'sub_menu',
      entity_id: id,
      summary: `Menambah sub menu "${name}" pada menu #${menuId}`,
    });
    res.status(201).json({ id, menu_id: menuId, name, image_url: req.file ? publicImageUrl(storedImageRel(req.file.filename)) : null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

app.put('/api/sub-menus/:id', upload.single('image'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = parseInt(req.params.id, 10);
    const name = String(req.body.name || '').trim();
    const actor_name = req.body.actor_name;
    if (!id || !name) return res.status(400).json({ error: 'ID dan nama wajib' });
    const [[existing]] = await conn.query(`SELECT id, image_path FROM sub_menus WHERE id=?`, [id]);
    if (!existing) return res.status(404).json({ error: 'Sub menu tidak ditemukan' });
    let image_path = existing.image_path;
    if (req.file) {
      if (existing.image_path) fs.unlink(path.join(__dirname, existing.image_path), () => {});
      image_path = storedImageRel(req.file.filename);
    }
    await conn.execute(`UPDATE sub_menus SET name=?, image_path=? WHERE id=?`, [name, image_path, id]);
    await logActivity(conn, {
      actor_name,
      action: 'update',
      entity_type: 'sub_menu',
      entity_id: id,
      summary: `Mengubah sub menu #${id}: ${name}`,
    });
    res.json({ id, name, image_url: publicImageUrl(image_path) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

app.delete('/api/sub-menus/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = parseInt(req.params.id, 10);
    const actor_name = req.body?.actor_name ?? req.query.actor_name;
    if (!id) return res.status(400).json({ error: 'ID tidak valid' });
    const [[row]] = await conn.query(`SELECT name, image_path FROM sub_menus WHERE id=?`, [id]);
    if (!row) return res.status(404).json({ error: 'Sub menu tidak ditemukan' });
    await conn.execute(`DELETE FROM sub_menus WHERE id=?`, [id]);
    if (row.image_path) fs.unlink(path.join(__dirname, row.image_path), () => {});
    await logActivity(conn, {
      actor_name,
      action: 'delete',
      entity_type: 'sub_menu',
      entity_id: id,
      summary: `Menghapus sub menu: ${row.name}`,
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

/** Inventory items (alat) */
app.get('/api/sub-menus/:subMenuId/items', async (req, res) => {
  try {
    const subMenuId = parseInt(req.params.subMenuId, 10);
    if (!subMenuId) return res.status(400).json({ error: 'subMenuId tidak valid' });
    const { page, limit, offset } = parsePagination(req.query);
    const { sql: sSql, params: sParams } = searchClause(req.query.search, 'i.name');
    const [[{ total: t }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM inventory_items i WHERE i.sub_menu_id=? ${sSql}`,
      [subMenuId, ...sParams]
    );
    const total = Number(t);
    const [rows] = await pool.query(
      `SELECT i.id, i.sub_menu_id, i.name, i.quantity, i.image_path, i.created_at, i.updated_at
       FROM inventory_items i WHERE i.sub_menu_id=? ${sSql} ORDER BY i.id DESC LIMIT ? OFFSET ?`,
      [subMenuId, ...sParams, limit, offset]
    );
    res.json({
      data: rows.map((r) => ({ ...r, image_url: publicImageUrl(r.image_path) })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/sub-menus/:subMenuId/items', upload.single('image'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const subMenuId = parseInt(req.params.subMenuId, 10);
    const name = String(req.body.name || '').trim();
    const quantity = Math.max(0, parseInt(String(req.body.quantity ?? '0'), 10) || 0);
    const actor_name = req.body.actor_name;
    if (!subMenuId || !name) return res.status(400).json({ error: 'Sub menu dan nama alat wajib' });
    const [[s]] = await conn.query(`SELECT id FROM sub_menus WHERE id=?`, [subMenuId]);
    if (!s) return res.status(404).json({ error: 'Sub menu tidak ditemukan' });
    const image_path = req.file ? storedImageRel(req.file.filename) : null;
    const [r] = await conn.execute(`INSERT INTO inventory_items (sub_menu_id, name, quantity, image_path) VALUES (?,?,?,?)`, [
      subMenuId,
      name,
      quantity,
      image_path,
    ]);
    const id = r.insertId;
    await logActivity(conn, {
      actor_name,
      action: 'create',
      entity_type: 'item',
      entity_id: id,
      summary: `Menambah alat "${name}" (qty ${quantity}) pada sub menu #${subMenuId}`,
    });
    res.status(201).json({ id, sub_menu_id: subMenuId, name, quantity, image_path, image_url: publicImageUrl(image_path) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

app.put('/api/items/:id', upload.single('image'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = parseInt(req.params.id, 10);
    const name = String(req.body.name || '').trim();
    const quantity = Math.max(0, parseInt(String(req.body.quantity ?? '0'), 10) || 0);
    const actor_name = req.body.actor_name;
    if (!id || !name) return res.status(400).json({ error: 'ID dan nama wajib' });
    const [[existing]] = await conn.query(`SELECT id, image_path FROM inventory_items WHERE id=?`, [id]);
    if (!existing) return res.status(404).json({ error: 'Alat tidak ditemukan' });
    let image_path = existing.image_path;
    if (req.file) {
      if (existing.image_path) fs.unlink(path.join(__dirname, existing.image_path), () => {});
      image_path = storedImageRel(req.file.filename);
    }
    await conn.execute(`UPDATE inventory_items SET name=?, quantity=?, image_path=? WHERE id=?`, [name, quantity, image_path, id]);
    await logActivity(conn, {
      actor_name,
      action: 'update',
      entity_type: 'item',
      entity_id: id,
      summary: `Mengubah alat #${id}: ${name} (qty ${quantity})`,
    });
    res.json({ id, name, quantity, image_path, image_url: publicImageUrl(image_path) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

app.delete('/api/items/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = parseInt(req.params.id, 10);
    const actor_name = req.body?.actor_name ?? req.query.actor_name;
    if (!id) return res.status(400).json({ error: 'ID tidak valid' });
    const [[row]] = await conn.query(`SELECT name, image_path FROM inventory_items WHERE id=?`, [id]);
    if (!row) return res.status(404).json({ error: 'Alat tidak ditemukan' });
    await conn.execute(`DELETE FROM inventory_items WHERE id=?`, [id]);
    if (row.image_path) fs.unlink(path.join(__dirname, row.image_path), () => {});
    await logActivity(conn, {
      actor_name,
      action: 'delete',
      entity_type: 'item',
      entity_id: id,
      summary: `Menghapus alat: ${row.name}`,
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

/** Activities (paginated + search on actor_name & summary) */
app.get('/api/activities', async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const search = String(req.query.search || '').trim();
    let extraSql = '';
    const params = [];
    if (search) {
      extraSql = ' AND (a.actor_name LIKE ? OR a.summary LIKE ?) ';
      const like = `%${search}%`;
      params.push(like, like);
    }
    const [[{ total: t }]] = await pool.query(`SELECT COUNT(*) AS total FROM activities a WHERE 1=1 ${extraSql}`, params);
    const total = Number(t);
    const [rows] = await pool.query(
      `SELECT a.id, a.actor_name, a.action, a.entity_type, a.entity_id, a.summary, a.created_at
       FROM activities a WHERE 1=1 ${extraSql} ORDER BY a.id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json({
      data: rows,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: err?.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`SINTA API listening on http://localhost:${PORT}`);
});
