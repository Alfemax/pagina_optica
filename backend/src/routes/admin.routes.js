import { Router } from 'express';
import { pool } from '../db.js';
import bcrypt from 'bcryptjs';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const r = Router();

// helpers
const normalizeEmail = (e) => (e || '').trim().toLowerCase();
const isStrongPassword = (pw) =>
  /^(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'"\\|,.<>/?`~]).{6,}$/.test(pw || "");

// todas las rutas del admin: token + rol 1
r.use(requireAuth, requireRole(1));

/**
 * GET /api/admin/overview
 * Pequeño resumen para tarjetas del dashboard
 */
r.get('/overview', async (_req, res) => {
  try {
    const [[{ total_usuarios }]] = await pool.query('SELECT COUNT(*) AS total_usuarios FROM usuarios WHERE activo=1');
    const [[{ total_admins }]]   = await pool.query('SELECT COUNT(*) AS total_admins FROM usuarios WHERE id_rol=1 AND activo=1');
    const [[{ total_optos }]]    = await pool.query('SELECT COUNT(*) AS total_optos FROM usuarios WHERE id_rol=2 AND activo=1');
    const [[{ total_pac }]]      = await pool.query('SELECT COUNT(*) AS total_pac FROM usuarios WHERE id_rol=3 AND activo=1');
    res.json({ ok: true, data: { total_usuarios, total_admins, total_optos, total_pac } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo obtener el resumen' });
  }
});

/**
 * GET /api/admin/users
 * Query params:
 *  - q        : texto para buscar por usuario/correo
 *  - rol      : 1|2|3 (opcional)
 *  - page     : 1..n
 *  - pageSize : 10..100
 */
r.get('/users', async (req, res) => {
  const q = `%${(req.query.q || '').trim()}%`;
  const rol = parseInt(req.query.rol, 10) || null;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(10, parseInt(req.query.pageSize, 10) || 12));
  const offset = (page - 1) * pageSize;

  try {
    const where = ['(usuario LIKE ? OR correo LIKE ?)'];
    const params = [q, q];

    if (rol) {
      where.push('id_rol = ?');
      params.push(rol);
    }

    const whereSql = 'WHERE ' + where.join(' AND ');

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM usuarios ${whereSql}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT id_usuario, usuario, correo, id_rol, verificado, activo
         FROM usuarios
         ${whereSql}
         ORDER BY id_usuario DESC
         LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({ ok: true, data: rows, page, pageSize, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo listar usuarios' });
  }
});

/**
 * POST /api/admin/users
 * body: { usuario, correo, password, id_rol }
 */
r.post('/users', async (req, res) => {
  try {
    let { usuario, correo, password, id_rol } = req.body;
    usuario = (usuario || '').trim();
    correo = normalizeEmail(correo);

    if (!usuario || !correo || !password || !id_rol) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: 'La contraseña debe tener mínimo 6 caracteres, un número y un caracter especial.' });
    }

    const [[exists]] = await pool.query(
      'SELECT COUNT(*) AS n FROM usuarios WHERE correo=?',
      [correo]
    );
    if (exists?.n) return res.status(409).json({ error: 'El correo ya existe' });

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO usuarios (usuario, correo, password_hash, id_rol, verificado, activo)
       VALUES (?, ?, ?, ?, 1, 1)`,
      [usuario, correo, hash, id_rol]
    );
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo crear el usuario' });
  }
});

/**
 * PUT /api/admin/users/:id
 * body: { usuario, correo, id_rol, activo }
 * - Evita dejar el sistema sin al menos 1 admin activo
 */
r.put('/users/:id', async (req, res) => {
  try {
    const { usuario, correo, id_rol, activo } = req.body;
    const { id } = req.params;

    // si estás degradando/desactivando un admin, valida que no sea el último
    const [[user]] = await pool.query('SELECT id_rol, activo FROM usuarios WHERE id_usuario=?', [id]);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const becomingNonAdmin = user.id_rol === 1 && (parseInt(id_rol,10) !== 1 || !activo);
    if (becomingNonAdmin) {
      const [[{ admins }]] = await pool.query('SELECT COUNT(*) AS admins FROM usuarios WHERE id_rol=1 AND activo=1 AND id_usuario<>?', [id]);
      if (admins === 0) return res.status(400).json({ error: 'Debe existir al menos un administrador activo' });
    }

    await pool.query(
      `UPDATE usuarios SET usuario=?, correo=?, id_rol=?, activo=? WHERE id_usuario=?`,
      [usuario, normalizeEmail(correo), id_rol, activo ? 1 : 0, id]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo actualizar' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Borrado lógico, con la misma salvaguarda del último admin.
 */
r.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [[user]] = await pool.query('SELECT id_rol, activo FROM usuarios WHERE id_usuario=?', [id]);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (user.id_rol === 1 && user.activo) {
      const [[{ admins }]] = await pool.query('SELECT COUNT(*) AS admins FROM usuarios WHERE id_rol=1 AND activo=1 AND id_usuario<>?', [id]);
      if (admins === 0) return res.status(400).json({ error: 'No puede eliminar al último administrador activo' });
    }

    await pool.query(`UPDATE usuarios SET activo=0 WHERE id_usuario=?`, [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo eliminar' });
  }
});

/**
 * PATCH /api/admin/users/:id/password
 * body: { password }
 */
r.patch('/users/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: 'Contraseña débil. Debe tener mínimo 6 caracteres, un número y un caracter especial.' });
    }
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE usuarios SET password_hash=? WHERE id_usuario=?', [hash, id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo actualizar la contraseña' });
  }
});

export default r;
