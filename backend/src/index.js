import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';
import { pool } from './db.js';
import bcrypt from 'bcryptjs';

import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import optoRoutes from './routes/opto.routes.js';
import rolesRoutes from './routes/roles.routes.js';
import securityRoutes from './routes/security.routes.js';
import profileRoutes from './routes/profile.routes.js';
import pacienteCitasRouter from './routes/paciente.citas.routes.js';
import settingsRoutes from './routes/settings.routes.js';

import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Configuración de Express ---
const app = express();
app.use(helmet());
app.use(cors({ origin: (process.env.CORS_ORIGIN || '*').split(',') }));
app.use(express.json());
app.use(morgan('dev'));

// --- SMTP check ---
import { verifySmtp } from './utils/mailer.js';
verifySmtp();

// --- Rutas principales ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/opto', optoRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/admin/security', securityRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api', profileRoutes);
app.use('/api/paciente', pacienteCitasRouter);

// --- Healthchecks ---
app.get('/healthz', (_req, res) => res.status(200).send('ok'));
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.get('/api/ping-db', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ db: rows[0]?.ok === 1 });
  } catch (e) {
    res.status(500).json({ error: 'DB connection failed', detail: String(e) });
  }
});

// --- Sembrar Admin si no existe ---
async function seedAdmin() {
  const correo = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const usuario = process.env.ADMIN_NAME || 'Administrador';
  const pwd = process.env.ADMIN_PASSWORD || 'Admin@123';
  if (!correo) return;

  const [rows] = await pool.query('SELECT id_usuario FROM usuarios WHERE correo=?', [correo]);
  if (rows.length) {
    console.log(`ℹ️ Admin existente: ${correo}`);
    return;
  }

  const hash = await bcrypt.hash(pwd, 10);
  await pool.query(
    `INSERT INTO usuarios (usuario, correo, password_hash, id_rol, verificado, activo)
     VALUES (?, ?, ?, 1, 1, 1)`,
    [usuario, correo, hash]
  );
  console.log(`✅ Admin creado: ${correo}`);
}

// --- Iniciar servidor ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`✅ API corriendo en http://localhost:${PORT}`);
  try {
    await seedAdmin();
  } catch (e) {
    console.error('❌ No se pudo sembrar admin:', e.message);
  }
});
