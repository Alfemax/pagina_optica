import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { sendVerificationEmail, sendResetEmail } from '../utils/mailer.js';

const DEBUG_MAIL = process.env.DEBUG_MAIL === '1';

/* =========================
   Helpers de normalización
   ========================= */
function normalizeCode(c) {
  return (c || '').toString().replace(/\D/g, '').slice(0, 6);
}
function isStrongPassword(pw) {
  // min 6, al menos un número y 1 caracter especial
  return /^(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'"\\|,.<>/?`~]).{6,}$/.test(pw || "");
}
function normalizeEmail(e) {
  return (e || '').trim().toLowerCase();
}
function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 dígitos
}

/* =========================
   Bitácora de autenticación
   ========================= */
async function logAuth({ correo, action, ip, ua }) {
  try {
    await pool.query(
      `INSERT INTO auth_logs (correo, action, ip, user_agent) VALUES (?, ?, ?, ?)`,
      [correo || '', action, ip || '', ua || '']
    );
  } catch { /* noop */ }
}

// (opcional) leer TTL del token desde config_seguridad
async function getTokenTTLHours() {
  try {
    const [[row]] = await pool.query(
      `SELECT v FROM config_seguridad WHERE k='token_ttl_hours' LIMIT 1`
    );
    const h = parseInt(row?.v, 10);
    return Number.isFinite(h) && h > 0 ? `${h}h` : '8h';
  } catch {
    return '8h';
  }
}

/* =============
   REGISTRO
   ============= */
export async function register(req, res) {
  try {
    let { usuario, correo, password, id_rol = 3 } = req.body;

    usuario = (usuario || '').trim();
    correo  = normalizeEmail(correo);

    if (!usuario || !correo || !password) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error: 'La contraseña debe tener mínimo 6 caracteres, incluir al menos 1 número y 1 carácter especial.'
      });
    }

    const [exists] = await pool.query(
      'SELECT id_usuario AS id FROM usuarios WHERE correo = ?',
      [correo]
    );
    if (exists.length) return res.status(409).json({ error: 'El correo ya está registrado' });

    const hash = await bcrypt.hash(password, 10);
    const code = genCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await pool.query(
      `INSERT INTO usuarios (id_rol, usuario, correo, password_hash, verificado, verificacion_codigo, verificacion_expira, activo)
       VALUES (?, ?, ?, ?, 0, ?, ?, 1)`,
      [id_rol, usuario, correo, hash, code, expires]
    );

    await sendVerificationEmail({ to: correo, code });

    // log
    await logAuth({ correo, action: 'register', ip: req.ip, ua: req.headers['user-agent'] });

    res.status(201).json({ ok: true, message: 'Usuario creado. Revisa tu correo para verificación.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo registrar' });
  }
}

/* =============
   VERIFICACIÓN
   ============= */
export async function verify(req, res) {
  try {
    const correo = normalizeEmail(req.body.correo);
    const code   = normalizeCode(req.body.code);

    if (!correo || !code) return res.status(400).json({ error: 'Datos incompletos' });

    const [rows] = await pool.query(
      `SELECT id_usuario AS id, verificado, verificacion_codigo, verificacion_expira
       FROM usuarios WHERE correo = ?`,
      [correo]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    const u = rows[0];
    const dbCode = normalizeCode(u.verificacion_codigo);

    if (u.verificado) {
      await logAuth({ correo, action: 'verify', ip: req.ip, ua: req.headers['user-agent'] });
      return res.json({ ok: true, message: 'Ya estaba verificado' });
    }
    if (!dbCode || dbCode !== code) {
      return res.status(400).json({ error: 'Código inválido' });
    }
    if (new Date(u.verificacion_expira) < new Date()) {
      return res.status(400).json({ error: 'Código expirado' });
    }

    await pool.query(
      `UPDATE usuarios
         SET verificado = 1,
             verificacion_codigo = NULL,
             verificacion_expira = NULL
       WHERE id_usuario = ?`,
      [u.id]
    );

    // log
    await logAuth({ correo, action: 'verify', ip: req.ip, ua: req.headers['user-agent'] });

    res.json({ ok: true, message: 'Cuenta verificada' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo verificar' });
  }
}

/* =============
   LOGIN
   ============= */
export async function login(req, res) {
  try {
    const { correo, password } = req.body;
    const correoNorm = normalizeEmail(correo);

    const [rows] = await pool.query(
      `SELECT id_usuario AS id, usuario, password_hash, verificado, id_rol, reset_requerido
       FROM usuarios WHERE correo = ? AND activo = 1`,
      [correoNorm]
    );
    if (!rows.length) {
      await logAuth({ correo: correoNorm, action: 'login_failed', ip: req.ip, ua: req.headers['user-agent'] });
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const u = rows[0];

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) {
      await logAuth({ correo: correoNorm, action: 'login_failed', ip: req.ip, ua: req.headers['user-agent'] });
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    if (!u.verificado) return res.status(403).json({ error: 'Cuenta no verificada' });

    // (opcional) fuerza cambio de contraseña
    if (u.reset_requerido) {
      await logAuth({ correo: correoNorm, action: 'login_failed', ip: req.ip, ua: req.headers['user-agent'] });
      return res.status(403).json({ error: 'Debe actualizar su contraseña antes de continuar' });
    }

    const expiresIn = await getTokenTTLHours(); // '8h' por defecto si no hay config
    const token = jwt.sign(
      { sub: u.id, correo: correoNorm, usuario: u.usuario, rol: u.id_rol },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    // log
    await logAuth({ correo: correoNorm, action: 'login_success', ip: req.ip, ua: req.headers['user-agent'] });

    res.json({ ok: true, token, usuario: u.usuario, rol: u.id_rol });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo iniciar sesión' });
  }
}

/* ===========================
   Olvidó su contraseña (5 min)
   =========================== */
export async function forgotPassword(req, res) {
  try {
    const correo = normalizeEmail(req.body.correo);
    if (!correo) return res.status(400).json({ error: 'Correo requerido' });

    const [rows] = await pool.query(
      `SELECT id_usuario AS id, verificado, activo FROM usuarios WHERE correo=?`,
      [correo]
    );

    // Mantener respuesta neutra (no filtrar existencia)
    if (!rows.length || !rows[0].activo) {
      await logAuth({ correo, action: 'reset_request', ip: req.ip, ua: req.headers['user-agent'] });
      return res.json({ ok: true, message: 'Si el correo existe, se enviará un código' });
    }

    const u = rows[0];

    const rawCode = genCode();
    const code = normalizeCode(rawCode);
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await pool.query(
      `UPDATE usuarios
         SET reset_codigo=?, reset_expira=?
       WHERE id_usuario=?`,
      [code, expires, u.id]
    );

    if (DEBUG_MAIL) {
      console.log(`[DEBUG] RESET -> correo=${correo}, code=${code}, expira=${expires.toISOString()}`);
    }

    await sendResetEmail({ to: correo, code });

    // log
    await logAuth({ correo, action: 'reset_request', ip: req.ip, ua: req.headers['user-agent'] });

    res.json({ ok: true, message: 'Se envió un código de verificación si el correo existe' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo procesar la solicitud' });
  }
}

export async function resetPassword(req, res) {
  try {
    const correo = normalizeEmail(req.body.correo);
    const code = normalizeCode(req.body.code);
    const newPassword = req.body.newPassword;

    if (!correo || !code || !newPassword) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        error: 'La contraseña debe tener mínimo 6 caracteres, incluir al menos 1 número y 1 carácter especial.'
      });
    }

    const [rows] = await pool.query(
      `SELECT id_usuario AS id, reset_codigo, reset_expira
       FROM usuarios WHERE correo=? AND activo=1`,
      [correo]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    const u = rows[0];
    const dbCode = normalizeCode(u.reset_codigo);

    if (!dbCode || dbCode !== code) {
      return res.status(400).json({ error: 'Código inválido' });
    }
    if (new Date(u.reset_expira) < new Date()) {
      return res.status(400).json({ error: 'Código expirado' });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE usuarios
          SET password_hash=?,
              reset_codigo=NULL,
              reset_expira=NULL,
              reset_requerido=0
        WHERE id_usuario=?`,
      [hash, u.id]
    );

    // log
    await logAuth({ correo, action: 'reset_success', ip: req.ip, ua: req.headers['user-agent'] });

    res.json({ ok: true, message: 'Contraseña actualizada' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo restablecer la contraseña' });
  }
}
