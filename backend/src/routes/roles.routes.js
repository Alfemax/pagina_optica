import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

// Catálogo de permisos soportados por el sistema.
// Puedes ampliar/renombrar, pero mantén los códigos estables.
export const PERMISSIONS = [
  // Usuarios
  'users.read',
  'users.create',
  'users.update',
  'users.delete',

  // Roles
  'roles.read',
  'roles.write',

  // Seguridad/Auditoría
  'security.read',

  // Citas
  'citas.read',
  'citas.write',

  // Fichas clínicas
  'fichas.read',
  'fichas.write',

  // CRM
  'crm.read',
  'crm.write',
];

const r = Router();
r.use(requireAuth, requireRole(1)); // solo admin

// 🔹 GET /api/roles/permisos (catálogo)
r.get('/permisos', (_req, res) => {
  res.json({ ok: true, data: PERMISSIONS });
});

// 🔹 GET /api/roles  (listar con búsqueda)
r.get('/', async (req, res) => {
  const q = `%${(req.query.q || '').trim()}%`;
  try {
    const [rows] = await pool.query(
      `SELECT id_rol, nombre, descripcion, activo,
              COALESCE(JSON_EXTRACT(permisos_json, '$'), JSON_ARRAY()) AS permisos_json
         FROM roles
        WHERE nombre LIKE ? OR descripcion LIKE ?
        ORDER BY id_rol ASC`,
      [q, q]
    );
    // normaliza a array JS
    const data = rows.map(r => ({
      ...r,
      permisos: Array.isArray(r.permisos_json) ? r.permisos_json : JSON.parse(r.permisos_json || '[]'),
    }));
    res.json({ ok: true, data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudieron listar los roles' });
  }
});

// 🔹 POST /api/roles  { id_rol, nombre, descripcion, activo, permisos:[] }
r.post('/', async (req, res) => {
  try {
    let { id_rol, nombre, descripcion = '', activo = 1, permisos = [] } = req.body;
    if (!id_rol || !nombre) return res.status(400).json({ error: 'Datos incompletos' });

    // valida permisos
    const invalid = (permisos || []).filter(p => !PERMISSIONS.includes(p));
    if (invalid.length) return res.status(400).json({ error: `Permisos inválidos: ${invalid.join(', ')}` });

    await pool.query(
      `INSERT INTO roles (id_rol, nombre, descripcion, activo, permisos_json)
       VALUES (?, ?, ?, ?, CAST(? AS JSON))`,
      [id_rol, nombre, descripcion, activo ? 1 : 0, JSON.stringify(permisos)]
    );

    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo crear el rol' });
  }
});

// 🔹 PUT /api/roles/:id  { nombre, descripcion, activo, permisos:[] }
r.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    let { nombre, descripcion = '', activo = 1, permisos = [] } = req.body;

    if (id === 1 && !activo) // nunca desactivar Admin
      return res.status(400).json({ error: 'No se puede desactivar el rol Administrador' });

    const invalid = (permisos || []).filter(p => !PERMISSIONS.includes(p));
    if (invalid.length) return res.status(400).json({ error: `Permisos inválidos: ${invalid.join(', ')}` });

    await pool.query(
      `UPDATE roles SET nombre=?, descripcion=?, activo=?, permisos_json=CAST(? AS JSON) WHERE id_rol=?`,
      [nombre, descripcion, activo ? 1 : 0, JSON.stringify(permisos), id]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo actualizar el rol' });
  }
});

// 🔹 DELETE /api/roles/:id  (protecciones)
r.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (id === 1) return res.status(400).json({ error: 'No se puede eliminar el rol Administrador' });

    // Evita borrar un rol en uso
    const [[{ en_uso }]] = await pool.query(
      'SELECT COUNT(*) AS en_uso FROM usuarios WHERE id_rol=? AND activo=1',
      [id]
    );
    if (en_uso > 0) return res.status(400).json({ error: 'No se puede eliminar un rol asignado a usuarios activos' });

    await pool.query('DELETE FROM roles WHERE id_rol=?', [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo eliminar el rol' });
  }
});

export default r;
