import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { transporter } from '../utils/mailer.js';

const r = Router();
r.use(requireAuth, requireRole(1)); // solo admin

async function getConfigMap() {
  const [rows] = await pool.query('SELECT k, v FROM config_seguridad');
  const map = {};
  for (const { k, v } of rows) map[k] = v;
  return map;
}

function toBool(x) { return String(x) === '1' || String(x) === 'true'; }

r.get('/', async (_req, res) => {
  const cfg = await getConfigMap();
  res.json({
    ok: true,
    data: {
      password_min: parseInt(cfg.password_min || '6', 10),
      password_require_number: toBool(cfg.password_require_number),
      password_require_special: toBool(cfg.password_require_special),
      token_ttl_hours: parseInt(cfg.token_ttl_hours || '8', 10),
      mfa_enabled: toBool(cfg.mfa_enabled),
      cors_origins: (cfg.cors_origins || '*'),
    }
  });
});

r.put('/', async (req, res) => {
  const {
    password_min = 6,
    password_require_number = true,
    password_require_special = true,
    token_ttl_hours = 8,
    mfa_enabled = false,
    cors_origins = '*',
  } = req.body;

  const entries = [
    ['password_min', String(Math.max(4, parseInt(password_min,10)||6))],
    ['password_require_number', password_require_number ? '1' : '0'],
    ['password_require_special', password_require_special ? '1' : '0'],
    ['token_ttl_hours', String(Math.max(1, parseInt(token_ttl_hours,10)||8))],
    ['mfa_enabled', mfa_enabled ? '1' : '0'],
    ['cors_origins', String(cors_origins || '*')],
  ];

  for (const [k,v] of entries) {
    await pool.query(
      `INSERT INTO config_seguridad (k, v) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE v=VALUES(v)`,
      [k, v]
    );
  }

  res.json({ ok: true });
});

// Enviar correo de prueba SMTP
r.post('/test-smtp', async (req, res) => {
  try {
    const { to } = req.body;
    await transporter.sendMail({
      to,
      from: process.env.MAIL_FROM,
      subject: 'Prueba de SMTP - Clínica El Áncora',
      text: 'Este es un correo de prueba del módulo de seguridad.',
    });
    res.json({ ok: true, message: 'Correo de prueba enviado' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo enviar el correo', detail: e.message });
  }
});

// Forzar cambio de contraseña
r.post('/force-reset/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('UPDATE usuarios SET reset_requerido=1 WHERE id_usuario=?', [id]);
  res.json({ ok: true });
});

// Mini bitácora
r.get('/audit', async (req, res) => {
  const limit = Math.min(200, Math.max(10, parseInt(req.query.limit,10) || 50));
  const [rows] = await pool.query(
    `SELECT id, correo, action, ip, user_agent, created_at
       FROM auth_logs
     ORDER BY id DESC
     LIMIT ?`, [limit]
  );
  res.json({ ok: true, data: rows });
});

export default r;
