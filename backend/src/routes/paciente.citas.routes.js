// backend/src/routes/paciente.citas.routes.js
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';

const r = Router();

/* --------- HORARIOS DISPONIBLES (público) --------- */
// GET /api/paciente/citas/slots?date=YYYY-MM-DD
r.get('/citas/slots', async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    if (!date) return res.status(400).json({ error: 'date requerido' });

    // Reglas:
    // L–V: 10-12 y 14-16  |  Sáb: 10-12  |  Domingos no se listan en UI
    const day = new Date(date + 'T00:00:00');
    const dow = day.getDay(); // 0=dom, 6=sab

    const bloques = [];
    const push = (key, label) => bloques.push({ key, label, available: true });

    if (dow >= 1 && dow <= 5) { // L–V
      push('AM', '10:00 – 12:00');
      push('PM', '14:00 – 16:00');
    } else if (dow === 6) {     // Sáb
      push('AM', '10:00 – 12:00');
    } else {
      return res.json({ ok: true, data: [] }); // domingo = sin horarios
    }

    // Marcar ocupados si ya hay cita en ese tramo
    const [rows] = await pool.query(
      `SELECT tramo, COUNT(*) n
         FROM citas
        WHERE DATE(inicio)=? AND estado IN ('pendiente','confirmada')
        GROUP BY tramo`,
      [date]
    );
    const ocupados = new Set(rows.filter(r => r.n > 0).map(r => r.tramo));
    for (const b of bloques) if (ocupados.has(b.key)) b.available = false;

    res.json({ ok: true, data: bloques });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo obtener slots' });
  }
});

/* --------- RESERVAR CITA (requiere login) --------- */
// POST /api/paciente/citas   Body: { date:'YYYY-MM-DD', tramo:'AM|PM' }
r.post('/citas', requireAuth, async (req, res) => {
  try {
    const { date, tramo } = req.body;
    const id_usuario = req.user.sub;
    if (!date || !tramo) return res.status(400).json({ error: 'Datos incompletos' });

    // construir inicio/fin según tramo
    const inicio = tramo === 'AM' ? `${date} 10:00:00` : `${date} 14:00:00`;
    const fin    = tramo === 'AM' ? `${date} 12:00:00` : `${date} 16:00:00`;

    // verificar ocupado del tramo (para todo el día)
    const [[ocupado]] = await pool.query(
      `SELECT COUNT(*) n
         FROM citas
        WHERE DATE(inicio)=? AND tramo=? AND estado IN ('pendiente','confirmada')`,
      [date, tramo]
    );
    if (ocupado.n) return res.status(409).json({ error: 'Ese horario ya fue reservado' });

    // asignar un optometrista activo (simple: primero disponible)
    const [[opt]] = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE id_rol=2 AND activo=1 ORDER BY id_usuario LIMIT 1'
    );
    if (!opt) return res.status(400).json({ error: 'No hay optometrista disponible' });

    // crear cita sin paciente; el optometrista la completará luego
    const [result] = await pool.query(
      `INSERT INTO citas
        (id_paciente, creado_por, id_optometrista, inicio, fin, estado, motivo, notas, tramo, source, creado_en, actualizado_en)
       VALUES (NULL, ?, ?, ?, ?, 'pendiente', NULL, NULL, ?, 'web', NOW(), NOW())`,
      [id_usuario, opt.id_usuario, inicio, fin, tramo]
    );

    res.status(201).json({ ok: true, id_cita: result.insertId, message: 'Reservada' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo reservar' });
  }
});

/* --------- MIS CITAS (requiere login) --------- */
// GET /api/paciente/citas
r.get('/citas', requireAuth, async (req, res) => {
  try {
    const id_usuario = req.user.sub;

    // Si el usuario está vinculado a un paciente, incluir también esas citas
    const [[pac]] = await pool.query(
      'SELECT id_paciente FROM pacientes WHERE id_usuario=?',
      [id_usuario]
    );
    const id_paciente = pac?.id_paciente || null;

    let sql = `
      SELECT id_cita, inicio, fin, estado, tramo, id_paciente
        FROM citas
       WHERE inicio >= NOW()
         AND (creado_por = ?
    `;
    const params = [id_usuario];

    if (id_paciente) {
      sql += ' OR id_paciente = ?';
      params.push(id_paciente);
    }
    sql += ') ORDER BY inicio ASC';

    const [rows] = await pool.query(sql, params);
    res.json({ ok: true, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudieron listar tus citas' });
  }
});

export default r;
