import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const r = Router();

// storage para imágenes (logo/hero)
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = file.fieldname === 'logo' ? 'logo' : 'hero';
    cb(null, `${base}${ext || '.png'}`);
  }
});
const upload = multer({ storage });

// protecciones: solo Admin
r.use(requireAuth, requireRole(1));

async function getAllConfig() {
  const [rows] = await pool.query('SELECT k, v FROM config_app');
  const map = {};
  for (const { k, v } of rows) map[k] = v;
  // normaliza JSON de horarios
  try {
    map.business_hours = JSON.parse(map.business_hours || '{}');
  } catch { map.business_hours = {}; }
  return map;
}

async function setConfig(entries = []) {
  for (const [k, v] of entries) {
    await pool.query(
      `INSERT INTO config_app (k, v) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE v=VALUES(v)`,
      [k, String(v)]
    );
  }
}

// GET configuración
r.get('/', async (_req, res) => {
  const cfg = await getAllConfig();
  res.json({ ok: true, data: cfg });
});

// PUT configuración
r.put('/', async (req, res) => {
  const {
    clinic_name, address, phone, whatsapp, email_from,
    logo_url, hero_url, cors_origins, maintenance,
    business_hours
  } = req.body;

  await setConfig([
    ['clinic_name', clinic_name ?? ''],
    ['address', address ?? ''],
    ['phone', phone ?? ''],
    ['whatsapp', whatsapp ?? ''],
    ['email_from', email_from ?? ''],
    ['logo_url', logo_url ?? ''],
    ['hero_url', hero_url ?? ''],
    ['cors_origins', cors_origins ?? '*'],
    ['maintenance', (maintenance ? '1' : '0')],
    ['business_hours', JSON.stringify(business_hours || {})],
  ]);

  res.json({ ok: true });
});

// Upload logo/hero
r.post('/upload', upload.fields([{ name:'logo' }, { name:'hero' }]), async (req, res) => {
  const updates = [];
  if (req.files?.logo?.[0]) {
    const ext = path.extname(req.files.logo[0].filename);
    updates.push(['logo_url', `/uploads/logo${ext}`]);
  }
  if (req.files?.hero?.[0]) {
    const ext = path.extname(req.files.hero[0].filename);
    updates.push(['hero_url', `/uploads/hero${ext}`]);
  }
  if (updates.length) await setConfig(updates);
  const cfg = await getAllConfig();
  res.json({ ok: true, data: { logo_url: cfg.logo_url, hero_url: cfg.hero_url } });
});

// Disparar “backup” (placeholder)
r.post('/backup', async (_req, res) => {
  // Aquí podrías lanzar un job real; por ahora, respondemos OK.
  res.json({ ok: true, message: 'Backup encolado' });
});

export default r;
