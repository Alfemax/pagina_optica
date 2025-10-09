import { Router } from 'express';

import {
  register,
  verify,
  login,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';

// NUEVO: rate limit para /auth/login
import { loginLimiter } from '../middlewares/rateLimit.js';

// NUEVO: importa middleware y rutas admin
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { pool } from '../db.js';
import bcrypt from 'bcryptjs';

const router = Router();

// --- Autenticación ---
router.post('/register', register);
router.post('/verify', verify);

// 🔒 Aplica rate limit al login
router.post('/login', loginLimiter, login);

// Reset contraseña (5 min)
router.post('/forgot', forgotPassword);
router.post('/reset', resetPassword);

// --- ADMIN DASHBOARD (todas protegidas por rol=1) ---
router.use('/admin', requireAuth, requireRole(1));

// Resumen
router.get('/admin/overview', async (_req, res) => {
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

// Usuarios CRUD
router.get('/admin/users', async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT id_usuario, usuario, correo, id_rol, verificado, activo
     FROM usuarios ORDER BY id_usuario DESC`
  );
  res.json({ ok: true, data: rows });
});

router.post('/admin/users', async (req, res) => {
  try {
    const { usuario, correo, password, id_rol } = req.body;
    if (!usuario || !correo || !password || !id_rol) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }
    const [[exists]] = await pool.query(
      'SELECT COUNT(*) AS n FROM usuarios WHERE correo=?',
      [correo.trim().toLowerCase()]
    );
    if (exists?.n) return res.status(409).json({ error: 'El correo ya existe' });

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO usuarios (usuario, correo, password_hash, id_rol, verificado, activo)
       VALUES (?, ?, ?, ?, 1, 1)`,
      [usuario.trim(), correo.trim().toLowerCase(), hash, id_rol]
    );
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo crear el usuario' });
  }
});

router.put('/admin/users/:id', async (req, res) => {
  try {
    const { usuario, correo, id_rol, activo } = req.body;
    const { id } = req.params;
    await pool.query(
      `UPDATE usuarios SET usuario=?, correo=?, id_rol=?, activo=? WHERE id_usuario=?`,
      [usuario, correo.trim().toLowerCase(), id_rol, activo ? 1 : 0, id]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo actualizar' });
  }
});

router.delete('/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE usuarios SET activo=0 WHERE id_usuario=?`, [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo eliminar' });
  }
});

// Roles (catálogo simple)
router.get('/admin/roles', async (_req, res) => {
  res.json({
    ok: true,
    data: [
      { id_rol: 1, nombre: 'Administrador' },
      { id_rol: 2, nombre: 'Optometrista' },
      { id_rol: 3, nombre: 'Paciente' },
    ],
  });
});

// Seguridad / Config (placeholder)
router.get('/admin/security', async (_req, res) => {
  res.json({ ok: true, data: { passwordPolicy: 'min6+numero+especial', mfa: false } });
});
router.post('/admin/security', async (_req, res) => {
  res.json({ ok: true });
});

// Settings / Backup (placeholder)
router.get('/admin/settings', async (_req, res) => {
  res.json({ ok: true, data: { backups: 'weekly', smtp: 'gmail', version: '1.0.0' } });
});
router.post('/admin/settings/backup', async (_req, res) => {
  res.json({ ok: true, message: 'Backup encolado' });
});

export default router;
