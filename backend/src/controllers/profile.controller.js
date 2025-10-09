import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { sendResetEmail } from '../utils/mailer.js';

// Utilidades
const DEBUG_MAIL = process.env.DEBUG_MAIL === '1';
const normalizeCode = (c) => (c || '').toString().replace(/\D/g, '').slice(0, 6);
const isStrongPassword = (pw) =>
  /^(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'"\\|,.<>/?`~]).{6,}$/.test(pw || "");

// GET /api/me
export async function getMe(req, res) {
  const userId = req.user.sub;
  const [rows] = await pool.query(
    `SELECT id_usuario AS id, usuario, correo, telefono, creado_en, actualizado_en
     FROM usuarios WHERE id_usuario=? AND activo=1`,
    [userId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ ok: true, data: rows[0] });
}

// PUT /api/me  (actualiza nombre y teléfono)
export async function updateMe(req, res) {
  const userId = req.user.sub;
  const usuario = (req.body.usuario || '').trim();
  const telefono = (req.body.telefono || '').trim();

  if (!usuario) return res.status(400).json({ error: 'El nombre es requerido' });

  await pool.query(
    `UPDATE usuarios SET usuario=?, telefono=?, actualizado_en=NOW() WHERE id_usuario=? AND activo=1`,
    [usuario, telefono || null, userId]
  );
  res.json({ ok: true });
}

/**
 * POST /api/me/password/request
 * Genera un código (5 min) y lo envía al correo del usuario.
 */
export async function requestPasswordChange(req, res) {
  const userId = req.user.sub;
  const [rows] = await pool.query(
    `SELECT id_usuario AS id, correo FROM usuarios WHERE id_usuario=? AND activo=1`,
    [userId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

  await pool.query(
    `UPDATE usuarios
       SET reset_codigo=?, reset_expira=?, reset_requerido=1
     WHERE id_usuario=?`,
    [code, expires, userId]
  );

  if (DEBUG_MAIL) {
    console.log(`[DEBUG] CHANGE-PWD -> user=${userId}, code=${code}, expira=${expires.toISOString()}`);
  }

  await sendResetEmail({ to: rows[0].correo, code });
  res.json({ ok: true, message: 'Te enviamos un código a tu correo' });
}

/**
 * POST /api/me/password/confirm
 * Body: { code, newPassword }
 */
export async function confirmPasswordChange(req, res) {
  const userId = req.user.sub;
  const codeIn = normalizeCode(req.body.code);
  const newPassword = req.body.newPassword;

  if (!codeIn || !newPassword) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }
  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({
      error: 'La contraseña debe tener mínimo 6 caracteres, incluir al menos 1 número y 1 carácter especial.'
    });
  }

  const [rows] = await pool.query(
    `SELECT reset_codigo, reset_expira, reset_requerido
       FROM usuarios WHERE id_usuario=? AND activo=1`,
    [userId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

  const u = rows[0];
  const dbCode = normalizeCode(u.reset_codigo);
  if (!u.reset_requerido) return res.status(400).json({ error: 'No hay una solicitud activa' });
  if (!dbCode || dbCode !== codeIn) return res.status(400).json({ error: 'Código inválido' });
  if (new Date(u.reset_expira) < new Date()) return res.status(400).json({ error: 'Código expirado' });

  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query(
    `UPDATE usuarios
        SET password_hash=?,
            reset_codigo=NULL,
            reset_expira=NULL,
            reset_requerido=0,
            actualizado_en=NOW()
      WHERE id_usuario=?`,
    [hash, userId]
  );

  res.json({ ok: true, message: 'Contraseña actualizada' });
}
