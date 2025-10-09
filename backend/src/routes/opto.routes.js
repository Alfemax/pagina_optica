// backend/src/routes/opto.routes.js
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import PDFDocument from 'pdfkit';
import crypto from 'crypto';

// === Utilidades de correo (ya las tienes) ===
import {
  sendAppointmentConfirmed,
  sendAppointmentCanceled,
  sendRecipeEmail,
} from '../utils/mailer.js';

const router = Router();

// Todas requieren login + rol=2 (Optometrista)
router.use(requireAuth, requireRole(2));

/* =====================================================
   Helpers (sin date-fns)
===================================================== */
function fmtDate(dateStr) {
  try {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch { return String(dateStr || ''); }
}
function fmtTime(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

async function getCorreoDestinoPorCita(id_cita) {
  // 1) correo del paciente (si hay)
  const [[p]] = await pool.query(`
    SELECT u.correo AS to_email,
           CONCAT(pac.nombres,' ',pac.apellidos) AS nombre
      FROM citas c
      JOIN pacientes pac ON pac.id_paciente = c.id_paciente
      JOIN usuarios  u   ON u.id_usuario   = pac.id_usuario
     WHERE c.id_cita = ?
     LIMIT 1
  `, [id_cita]);
  if (p?.to_email) return p;

  // 2) creador de la cita
  const [[u]] = await pool.query(`
    SELECT u.correo AS to_email, u.usuario AS nombre
      FROM citas c
      JOIN usuarios u ON u.id_usuario = c.creado_por
     WHERE c.id_cita = ?
     LIMIT 1
  `, [id_cita]);
  return u || null;
}

/* PDF a Buffer */
function pdfToBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

/* =====================================================
   UTIL: Validar solapes de citas (overlaps)
===================================================== */
async function hasOverlap({ id_optometrista, inicio, fin, excludeId = null }) {
  const params = [id_optometrista, inicio, fin, inicio, fin];
  let sql = `
    SELECT COUNT(*) AS n
      FROM citas
     WHERE id_optometrista = ?
       AND estado IN ('pendiente','confirmada')
       AND (? < fin AND ? > inicio)
  `;
  if (excludeId) {
    sql += ` AND id_cita <> ?`;
    params.push(excludeId);
  }
  const [[row]] = await pool.query(sql, params);
  return row.n > 0;
}

/* =====================================================
   USUARIOS CANDIDATOS (rol=3, sin paciente vinculado)
===================================================== */
router.get('/users-candidates', async (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    const params = [];
    let sql = `
      SELECT u.id_usuario, u.usuario, u.correo
        FROM usuarios u
        LEFT JOIN pacientes p ON p.id_usuario = u.id_usuario
       WHERE u.id_rol = 3
         AND u.activo = 1
         AND p.id_paciente IS NULL
    `;
    if (q) {
      sql += ` AND (LOWER(u.usuario) LIKE ? OR LOWER(u.correo) LIKE ?)`
      params.push(`%${q}%`, `%${q}%`);
    }
    sql += ` ORDER BY u.usuario ASC`;
    const [rows] = await pool.query(sql, params);
    res.json({ ok: true, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo listar candidatos' });
  }
});

/* =====================================================
   CRUD PACIENTES
===================================================== */
router.get('/pacientes', async (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    const params = [];
    let sql = `
      SELECT p.id_paciente, p.id_usuario, p.dpi, p.nombres, p.apellidos,
             DATE_FORMAT(p.fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento,
             p.correo, p.telefono, p.direccion,
             u.usuario AS usuario_nombre
        FROM pacientes p
        JOIN usuarios u ON u.id_usuario = p.id_usuario
       WHERE 1=1
    `;
    if (q) {
      sql += `
        AND (
          LOWER(p.nombres)   LIKE ? OR
          LOWER(p.apellidos) LIKE ? OR
          LOWER(p.correo)    LIKE ? OR
          LOWER(u.usuario)   LIKE ? OR
          p.dpi LIKE ?
        )`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }
    sql += ` ORDER BY p.id_paciente DESC`;
    const [rows] = await pool.query(sql, params);
    res.json({ ok: true, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo listar pacientes' });
  }
});

router.get('/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT p.*, DATE_FORMAT(p.fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento
         FROM pacientes p
        WHERE p.id_paciente=?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.json({ ok: true, data: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo obtener el paciente' });
  }
});

router.post('/pacientes', async (req, res) => {
  try {
    const { id_usuario, dpi, nombres, apellidos, fecha_nacimiento, telefono, direccion } = req.body;
    if (!id_usuario || !nombres || !apellidos) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    const [[user]] = await pool.query(
      `SELECT correo FROM usuarios WHERE id_usuario=? AND id_rol=3 AND activo=1`,
      [id_usuario]
    );
    if (!user) return res.status(400).json({ error: 'Usuario inválido para paciente' });

    const [[exists]] = await pool.query(
      `SELECT COUNT(*) AS n FROM pacientes WHERE id_usuario=?`,
      [id_usuario]
    );
    if (exists?.n) return res.status(409).json({ error: 'El usuario ya está vinculado a un paciente' });

    await pool.query(
      `INSERT INTO pacientes
        (id_usuario, dpi, nombres, apellidos, fecha_nacimiento, correo, telefono, direccion, creado_en, actualizado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id_usuario,
        dpi || null,
        nombres,
        apellidos,
        fecha_nacimiento || null,
        user.correo,
        telefono || null,
        direccion || null
      ]
    );

    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo crear el paciente' });
  }
});

router.put('/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { dpi, nombres, apellidos, fecha_nacimiento, correo, telefono, direccion } = req.body;

    await pool.query(
      `UPDATE pacientes
          SET dpi=?, nombres=?, apellidos=?, fecha_nacimiento=?, correo=?, telefono=?, direccion=?, actualizado_en=NOW()
        WHERE id_paciente=?`,
      [dpi || null, nombres, apellidos, fecha_nacimiento || null, correo || null, telefono || null, direccion || null, id]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo actualizar el paciente' });
  }
});

router.delete('/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [[hasFuture]] = await pool.query(
      `SELECT COUNT(*) AS n
         FROM citas
        WHERE id_paciente = ? AND inicio >= NOW()`,
      [id]
    );
    if (hasFuture.n > 0) {
      return res.status(409).json({ error: 'No se puede eliminar: el paciente tiene citas futuras' });
    }
    await pool.query(`DELETE FROM pacientes WHERE id_paciente=?`, [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo eliminar el paciente' });
  }
});

/* =====================================================
   AGENDA Y CRUD DE CITAS
===================================================== */

// LISTAR AGENDA DEL DÍA
router.get('/agenda', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    const [rows] = await pool.query(
      `SELECT 
          c.id_cita, c.inicio, c.fin, c.estado, c.motivo, c.notas, c.tramo,
          TIMESTAMPDIFF(MINUTE, c.inicio, c.fin) AS duracion_minutos,
          c.id_paciente,
          p.nombres, p.apellidos,
          CASE 
            WHEN p.id_paciente IS NULL THEN '— Sin asignar —'
            ELSE CONCAT(p.nombres, ' ', p.apellidos)
          END AS paciente_nombre
       FROM citas c
       LEFT JOIN pacientes p ON p.id_paciente = c.id_paciente
      WHERE DATE(c.inicio) = ?
      ORDER BY c.inicio ASC`,
      [date]
    );

    res.json({ ok: true, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo obtener la agenda' });
  }
});

// CREAR CITA
router.post('/citas', async (req, res) => {
  try {
    const { id_paciente = null, inicio, fin, motivo, notas, source = 'admin' } = req.body;
    const id_optometrista = req.user.sub;
    const creado_por = req.user.sub;

    if (!inicio || !fin) {
      return res.status(400).json({ error: 'Inicio y fin son obligatorios' });
    }

    const overlap = await hasOverlap({ id_optometrista, inicio, fin });
    if (overlap) {
      return res.status(409).json({ error: 'Existe un solape con otra cita del optometrista' });
    }

    const [result] = await pool.query(
      `INSERT INTO citas
        (id_paciente, creado_por, id_optometrista, inicio, fin, estado, motivo, notas, recordatorio_enviado, source, creado_en, actualizado_en)
       VALUES (?, ?, ?, ?, ?, 'pendiente', ?, ?, 0, ?, NOW(), NOW())`,
      [id_paciente, creado_por, id_optometrista, inicio, fin, motivo || null, notas || null, source]
    );

    res.status(201).json({ ok: true, id_cita: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo crear la cita' });
  }
});

// ACTUALIZAR CITA
router.put('/citas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { inicio, fin, estado, motivo, notas } = req.body;

    if (inicio && fin) {
      const [[row]] = await pool.query(`SELECT id_optometrista FROM citas WHERE id_cita=?`, [id]);
      if (!row) return res.status(404).json({ error: 'Cita no encontrada' });
      const overlap = await hasOverlap({ id_optometrista: row.id_optometrista, inicio, fin, excludeId: id });
      if (overlap) return res.status(409).json({ error: 'Existe un solape con otra cita' });
    }

    await pool.query(
      `UPDATE citas
          SET inicio = COALESCE(?, inicio),
              fin    = COALESCE(?, fin),
              estado = COALESCE(?, estado),
              motivo = COALESCE(?, motivo),
              notas  = COALESCE(?, notas),
              actualizado_en = NOW()
        WHERE id_cita = ?`,
      [inicio || null, fin || null, estado || null, motivo || null, notas || null, id]
    );

    res.json({ ok: true, message: 'Cita actualizada' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo actualizar la cita' });
  }
});

// CAMBIAR ESTADO RÁPIDO + EMAIL
router.patch('/citas/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, motivo } = req.body || {};
    if (!estado) return res.status(400).json({ error: 'Estado requerido' });

    const [[cita]] = await pool.query(
      `SELECT inicio, fin FROM citas WHERE id_cita=?`,
      [id]
    );

    await pool.query(
      `UPDATE citas
          SET estado=?, actualizado_en=NOW()
        WHERE id_cita=?`,
      [estado, id]
    );

    const dest = await getCorreoDestinoPorCita(id);
    if (dest?.to_email && cita) {
      const fecha = fmtDate(cita.inicio);
      const franja = `${fmtTime(cita.inicio)} – ${fmtTime(cita.fin)}`;

      try {
        if (estado === 'confirmada') {
          await sendAppointmentConfirmed({
            to: dest.to_email,
            nombre: dest.nombre || dest.to_email,
            fecha,
            franja
          });
        } else if (estado === 'cancelada') {
          await sendAppointmentCanceled({
            to: dest.to_email,
            nombre: dest.nombre || dest.to_email,
            fecha,
            franja,
            motivo: motivo || ''
          });
        }
      } catch (mailErr) {
        console.error('MAIL error (status):', mailErr?.message);
      }
    }

    const payload = { ok: true };
    if (estado === 'completada') payload.nextAction = 'make_rx';
    res.json(payload);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo cambiar el estado' });
  }
});

// CANCELAR (borrado lógico con motivo)
router.delete('/citas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body || {};
    await pool.query(
      `UPDATE citas
          SET estado='cancelada',
              cancelado_por=?,
              cancel_motivo=?,
              actualizado_en=NOW()
        WHERE id_cita=?`,
      [req.user.sub, motivo || null, id]
    );

    const dest = await getCorreoDestinoPorCita(id);
    if (dest?.to_email) {
      const [[cita]] = await pool.query(`SELECT inicio, fin FROM citas WHERE id_cita=?`, [id]);
      if (cita) {
        const fecha = fmtDate(cita.inicio);
        const franja = `${fmtTime(cita.inicio)} – ${fmtTime(cita.fin)}`;
        try {
          await sendAppointmentCanceled({
            to: dest.to_email,
            nombre: dest.nombre || dest.to_email,
            fecha,
            franja,
            motivo: motivo || ''
          });
        } catch (mailErr) {
          console.error('MAIL error (cancel):', mailErr?.message);
        }
      }
    }

    res.json({ ok: true, message: 'Cita cancelada' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo cancelar la cita' });
  }
});

/* =====================================================
   FICHAS MÉDICAS (schema exacto)
===================================================== */

// util: normaliza booleanos (checkboxes)
function b(v) { return v ? 1 : 0; }

// Campos permitidos para crear/actualizar
const FM_FIELDS = [
  'ocupacion', 'usa_anteojos', 'usa_anteojos_prev',
  'graduacion_od_prev', 'graduacion_oi_prev',
  'cefalea', 'ardor_ocular', 'prurito', 'es_diabetico',
  'dolor_ocular', 'epifora', 'moscas_volantes', 'es_hipertenso',
  'fotofobia', 'sombras', 'halos', 'hay_embarazo',
  'antecedentes_familiares',
  'tratamiento_actual', 'agudeza_sc_od', 'agudeza_sc_oi',
  'agudeza_cc_od', 'agudeza_cc_oi',
  'oftalmoscopia_nl', 'oftalmoscopia_no_normal',
  'consideraciones_od', 'consideraciones_oi',
  'retinoscopia_od', 'retinoscopia_oi',
  'test_bicromatico_s', 'test_bicromatico_n',
  'cilindros_cruzados_s', 'cilindros_cruzados_n',
  'baston_madox_s', 'baston_madox_n',
  'forias', 'tropias',
  'grad_final_ld_od', 'grad_final_ld_oi',
  'grad_final_add_od', 'grad_final_add_oi',
  'tratamiento_diagnostico',
];

// LISTAR
router.get('/fichas', async (req, res) => {
  try {
    const { q = '', id_paciente } = req.query;
    const params = [];
    let sql = `
      SELECT fm.*,
             CONCAT(p.nombres,' ',p.apellidos) AS paciente_nombre
        FROM fichas_medicas fm
        JOIN pacientes p ON p.id_paciente = fm.id_paciente
       WHERE 1=1
    `;
    if (id_paciente) {
      sql += ` AND fm.id_paciente = ?`;
      params.push(id_paciente);
    }
    if (q.trim()) {
      sql += ` AND (LOWER(p.nombres) LIKE ? OR LOWER(p.apellidos) LIKE ? OR LOWER(fm.ocupacion) LIKE ?)`;
      const like = `%${q.toLowerCase()}%`;
      params.push(like, like, like);
    }
    sql += ` ORDER BY fm.id_ficha DESC LIMIT 200`;
    const [rows] = await pool.query(sql, params);
    res.json({ ok: true, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo listar fichas' });
  }
});

// OBTENER UNA
router.get('/fichas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT fm.*, CONCAT(p.nombres,' ',p.apellidos) AS paciente_nombre
         FROM fichas_medicas fm
         JOIN pacientes p ON p.id_paciente = fm.id_paciente
        WHERE fm.id_ficha = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Ficha no encontrada' });
    res.json({ ok: true, data: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo obtener la ficha' });
  }
});

// CREAR
router.post('/fichas', async (req, res) => {
  try {
    const { id_paciente, ...rest } = req.body;
    if (!id_paciente) return res.status(400).json({ error: 'id_paciente es requerido' });

    const [[pac]] = await pool.query(`SELECT id_paciente FROM pacientes WHERE id_paciente=?`, [id_paciente]);
    if (!pac) return res.status(400).json({ error: 'Paciente inválido' });

    const id_optometrista = req.user.sub;

    const cols = ['id_paciente', 'id_optometrista'];
    const vals = [id_paciente, id_optometrista];
    const qms  = ['?', '?'];

    for (const k of FM_FIELDS) {
      if (k in rest) {
        cols.push(k);
        if ([
          'usa_anteojos','usa_anteojos_prev',
          'cefalea','ardor_ocular','prurito','es_diabetico','dolor_ocular',
          'epifora','moscas_volantes','es_hipertenso','fotofobia','sombras',
          'halos','hay_embarazo','oftalmoscopia_nl','oftalmoscopia_no_normal',
          'test_bicromatico_s','test_bicromatico_n','cilindros_cruzados_s',
          'cilindros_cruzados_n','baston_madox_s','baston_madox_n'
        ].includes(k)) {
          vals.push(b(rest[k]));
        } else {
          vals.push(rest[k] ?? null);
        }
        qms.push('?');
      }
    }

    const sql = `
      INSERT INTO fichas_medicas (${cols.join(',')}, creado_en, actualizado_en)
      VALUES (${qms.join(',')}, NOW(), NOW())
    `;
    const [r] = await pool.query(sql, vals);
    res.status(201).json({ ok: true, id_ficha: r.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo crear la ficha' });
  }
});

// ACTUALIZAR
router.put('/fichas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const set = [];
    const vals = [];

    for (const k of FM_FIELDS) {
      if (k in req.body) {
        set.push(`${k}=?`);
        if ([
          'usa_anteojos','usa_anteojos_prev',
          'cefalea','ardor_ocular','prurito','es_diabetico','dolor_ocular',
          'epifora','moscas_volantes','es_hipertenso','fotofobia','sombras',
          'halos','hay_embarazo','oftalmoscopia_nl','oftalmoscopia_no_normal',
          'test_bicromatico_s','test_bicromatico_n','cilindros_cruzados_s',
          'cilindros_cruzados_n','baston_madox_s','baston_madox_n'
        ].includes(k)) {
          vals.push(b(req.body[k]));
        } else {
          vals.push(req.body[k] ?? null);
        }
      }
    }
    if (!set.length) return res.status(400).json({ error: 'Nada que actualizar' });

    const sql = `
      UPDATE fichas_medicas
         SET ${set.join(', ')}, actualizado_en=NOW()
       WHERE id_ficha=?
    `;
    vals.push(id);
    await pool.query(sql, vals);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo actualizar la ficha' });
  }
});

// HABILITAR / INHABILITAR
router.patch('/fichas/:id/activo', async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    await pool.query(
      `UPDATE fichas_medicas SET activo=?, actualizado_en=NOW() WHERE id_ficha=?`,
      [activo ? 1 : 0, id]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo cambiar el estado' });
  }
});

/* =====================================================
   ============  RECETAS (talonario real)  =============
   Crear + enviar email + servir PDF temporal
===================================================== */

/* === Generador del PDF con el diseño del talonario === */
async function buildRecetaPDF({ receta = {}, mode = 'final' } = {}) {
  const {
    paciente_nombre = '',
    fecha = '',

    // OD
    od_esf = '', od_cil = '', od_eje = '', od_dp = '', od_color = '', od_add = '',
    // OI
    oi_esf = '', oi_cil = '', oi_eje = '', oi_dp = '', oi_color = '', oi_add = '',
    // notas
    observaciones = '',
  } = receta;

  const doc = new PDFDocument({ size: 'LETTER', margin: 36 }); // tamaño carta
  const black = '#000000';
  const gray = '#333333';
  const f = { normal: 'Helvetica', bold: 'Helvetica-Bold' };

  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const boxX = 28;
  const boxY = 22;
  const boxW = pageW - boxX * 2;
  const boxH = pageH - boxY * 2;

  // Marco doble redondeado
  roundedRect(doc, boxX, boxY, boxW, boxH, 16).stroke(black);
  roundedRect(doc, boxX + 6, boxY + 6, boxW - 12, boxH - 12, 12).stroke(black);

  // Encabezado
  drawCaduceus(doc, boxX + 20, boxY + 40, 60, black);

  doc.font(f.bold).fontSize(24).fillColor(black)
     .text('EL ANCORA CENTRO OPTICO', boxX + 110, boxY + 26, { width: boxW - 160, align: 'center' });

  doc.font(f.normal).fontSize(10).fillColor(gray)
     .text('11 CALLE 5-75 ZONA 1 CENTRO HISTORICO GUATEMALA', boxX + 110, boxY + 54, { width: boxW - 160, align: 'center' })
     .moveDown(0.2)
     .font(f.bold).text('TELEFONO: 2232-2721     ☎     📱 4144-5224', { align: 'center' })
     .moveDown(0.2)
     .font(f.bold).fontSize(12).fillColor(black).text('ALFONSO BARAHONA', { align: 'center' })
     .font(f.normal).fontSize(10).fillColor(gray).text('OPTOMETRISTA', { align: 'center' });

  // Líneas FECHA y PACIENTE
  let curY = boxY + 118;
  const leftPad = boxX + 18;
  const rightPad = boxX + boxW - 18;

  curY = labeledLine(doc, 'FECHA:', fmtDMY(fecha), leftPad, curY, rightPad, f, black);
  curY = labeledLine(doc, 'PACIENTE:', paciente_nombre, leftPad, curY + 10, rightPad, f, black);

  // Tabla OD/OI
  const tabTop = curY + 20;
  const tabLeft = leftPad;
  const tabRight = rightPad;
  const tabWidth = tabRight - tabLeft;
  const tabHeight = 150;

  roundedRect(doc, tabLeft, tabTop, tabWidth, tabHeight, 12).stroke(black);

  const headerY = tabTop - 20;
  doc.font(f.bold).fontSize(12).fillColor(black);
  const cols = ['ESF', 'CIL.', 'EJE', 'D.P.', 'COLOR', 'ADD.'];
  const colWidths = [tabWidth * 0.18, tabWidth * 0.16, tabWidth * 0.16, tabWidth * 0.16, tabWidth * 0.18, tabWidth * 0.16];
  const colX = [];
  let accX = tabLeft + 80; // espacio para OD/OI
  for (let i = 0; i < colWidths.length; i++) {
    colX.push(accX);
    doc.text(cols[i], accX + 6, headerY);
    accX += colWidths[i];
  }

  // separador OD/OI
  doc.moveTo(tabLeft + 70, tabTop).lineTo(tabLeft + 70, tabTop + tabHeight).stroke();

  // OD / OI
  doc.font(f.bold).fontSize(20);
  doc.text('OD', tabLeft + 18, tabTop + 18);
  doc.text('OI', tabLeft + 18, tabTop + 88);

  // divisiones
  const midY = tabTop + tabHeight / 2;
  doc.moveTo(tabLeft, midY).lineTo(tabLeft + tabWidth, midY).stroke();

  let xv = tabLeft + 70;
  for (let i = 0; i < colWidths.length; i++) {
    xv += colWidths[i];
    doc.moveTo(xv, tabTop).lineTo(xv, tabTop + tabHeight).stroke();
  }

  // Valores
  const rowCenter1 = tabTop + (tabHeight / 4);
  const rowCenter2 = tabTop + (tabHeight * 3 / 4);
  doc.font(f.normal).fontSize(14);

  const put = (text, colIdx, rowCenter) => {
    const x0 = (colIdx === 0) ? tabLeft + 70 : colX[colIdx];
    const w  = colWidths[colIdx];
    doc.text(String(text ?? ''), x0, rowCenter - 10, { width: w, align: 'center' });
  };

  // OD
  put(od_esf, 0, rowCenter1);
  put(od_cil, 1, rowCenter1);
  put(od_eje, 2, rowCenter1);
  put(od_dp,  3, rowCenter1);
  put(od_color, 4, rowCenter1);
  put(od_add, 5, rowCenter1);

  // OI
  put(oi_esf, 0, rowCenter2);
  put(oi_cil, 1, rowCenter2);
  put(oi_eje, 2, rowCenter2);
  put(oi_dp,  3, rowCenter2);
  put(oi_color, 4, rowCenter2);
  put(oi_add, 5, rowCenter2);

  // símbolo +/- decorativo en ADD
  const addRight = tabLeft + 70 + colWidths.slice(0, 6).reduce((a, b) => a + b, 0);
  doc.moveTo(addRight + 10, tabTop + 20).lineTo(addRight + 28, tabTop + 20).stroke();
  doc.moveTo(addRight + 19, tabTop + 12).lineTo(addRight + 19, tabTop + 28).stroke();

  // Observaciones
  const obsTop = tabTop + tabHeight + 24;
  doc.font(f.bold).fontSize(12).text('OBSERVACIONES:', leftPad, obsTop);
  const lineY = obsTop + 16;
  drawLongLine(doc, leftPad + 110, lineY, rightPad - (leftPad + 110));

  if (String(observaciones || '').trim()) {
    doc.font(f.normal).fontSize(11).fillColor(black)
       .text(String(observaciones), leftPad + 115, obsTop + 2, {
         width: (rightPad - (leftPad + 115)) - 10,
         height: 40,
       });
  }

  // Firma Dr.
  const drY = lineY + 64;
  doc.font(f.bold).fontSize(12).text('Dr.', rightPad - 160, drY);
  drawLongLine(doc, rightPad - 130, drY + 14, 120);

  // devolver
  return await pdfToBuffer(doc);
}

/* ===== helpers de dibujo para la receta ===== */
function roundedRect(doc, x, y, w, h, r = 8) {
  doc.roundedRect(x, y, w, h, r); return doc;
}
function drawLongLine(doc, x, y, len) {
  doc.moveTo(x, y).lineTo(x + len, y).stroke();
}
function labeledLine(doc, label, value, x1, y, x2, fonts, color) {
  doc.font(fonts.bold).fontSize(12).fillColor(color).text(label, x1, y);
  const tw = 7 * label.length;
  drawLongLine(doc, x1 + tw, y + 14, x2 - (x1 + tw));
  if (value) {
    doc.font(fonts.normal).fontSize(11).fillColor(color)
       .text(String(value), x1 + tw + 6, y - 1, { width: (x2 - (x1 + tw + 10)) });
  }
  return y + 22;
}
function fmtDMY(d) {
  try {
    if (!d) return '';
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${day}/${m}/${y}`;
  } catch { return String(d || ''); }
}
function drawCaduceus(doc, x, y, size = 60, color = '#000') {
  const cx = x + size / 2;
  const top = y;
  const bottom = y + size;
  doc.save().lineWidth(1.2).strokeColor(color);
  // alas
  doc.moveTo(cx, top + 10).curveTo(cx - 12, top + 6, x + 6, top + 16, x + 8, top + 26).stroke();
  doc.moveTo(cx, top + 10).curveTo(cx + 12, top + 6, x + size - 6, top + 16, x + size - 8, top + 26).stroke();
  // vara
  doc.moveTo(cx, top + 10).lineTo(cx, bottom - 8).stroke();
  // serpientes
  doc.moveTo(cx - 6, top + 22).curveTo(cx - 18, top + 30, cx - 18, top + 44, cx - 6, top + 50).stroke();
  doc.moveTo(cx + 6, top + 22).curveTo(cx + 18, top + 30, cx + 18, top + 44, cx + 6, top + 50).stroke();
  // base
  doc.moveTo(cx - 14, bottom - 10).lineTo(cx + 14, bottom - 10).stroke();
  doc.restore();
}

/* ===== almacenamiento temporal para descarga ===== */
const recetaStore = new Map(); // id -> Buffer
function putRecetaTmp(id, buf) {
  recetaStore.set(id, buf);
  setTimeout(() => recetaStore.delete(id), 24 * 60 * 60 * 1000); // 24h
}

/* ===== endpoints de receta ===== */
router.post('/recetas', async (req, res) => {
  try {
    const {
      id_cita = null,
      id_paciente = null,
      paciente_nombre = '',
      fecha,
      od_esf, od_cil, od_eje, od_dp, od_color, od_add,
      oi_esf, oi_cil, oi_eje, oi_dp, oi_color, oi_add,
      observaciones = ''
    } = req.body;

    if (!fecha) {
      return res.status(400).json({ error: 'La fecha de la receta es obligatoria' });
    }

    const receta = {
      id_cita,
      id_paciente,
      paciente_nombre,
      fecha,
      od_esf, od_cil, od_eje, od_dp, od_color, od_add,
      oi_esf, oi_cil, oi_eje, oi_dp, oi_color, oi_add,
      observaciones
    };

    // Construir PDF
    let pdfBuffer;
    try {
      pdfBuffer = await buildRecetaPDF({ receta, mode: 'final' });
    } catch (err) {
      console.error('RECETA PDF (helper) falló:', err?.message);
      // Fallback minimal
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      doc.fontSize(18).text('Receta Óptica', { align: 'center' });
      doc.moveDown();
      doc.fontSize(11).text(`Paciente: ${paciente_nombre || 'N/D'}`);
      doc.text(`Fecha: ${fmtDate(fecha)}`);
      doc.moveDown();
      doc.text('OD:', { continued: true }).text(
        `  ESF:${od_esf||'-'}  CIL:${od_cil||'-'}  EJE:${od_eje||'-'}  DP:${od_dp||'-'}  COLOR:${od_color||'-'}  ADD:${od_add||'-'}`
      );
      doc.text('OI:', { continued: true }).text(
        `  ESF:${oi_esf||'-'}  CIL:${oi_cil||'-'}  EJE:${oi_eje||'-'}  DP:${oi_dp||'-'}  COLOR:${oi_color||'-'}  ADD:${oi_add||'-'}`
      );
      doc.moveDown();
      doc.text('Observaciones:');
      doc.text(observaciones || '—');
      pdfBuffer = await pdfToBuffer(doc);
    }

    const id_receta = crypto.randomUUID();
    putRecetaTmp(id_receta, pdfBuffer);

    // Enviar correo (best-effort)
    let emailSent = false;
    try {
      let to_email = null;
      let nombre = paciente_nombre || 'Paciente';

      if (id_cita) {
        const dest = await getCorreoDestinoPorCita(id_cita);
        if (dest?.to_email) {
          to_email = dest.to_email;
          if (dest?.nombre) nombre = dest.nombre;
        }
      } else if (id_paciente) {
        const [[row]] = await pool.query(`
          SELECT u.correo AS to_email, CONCAT(p.nombres,' ',p.apellidos) AS nombre
            FROM pacientes p
            JOIN usuarios  u ON u.id_usuario = p.id_usuario
           WHERE p.id_paciente = ?
           LIMIT 1
        `, [id_paciente]);
        if (row?.to_email) {
          to_email = row.to_email;
          if (row?.nombre) nombre = row.nombre;
        }
      }

      if (to_email) {
        await sendRecipeEmail({
          to: to_email,
          nombre,
          id_receta,
          pdfBuffer
        });
        emailSent = true;
      }
    } catch (mailErr) {
      console.error('RECETA MAIL falló:', mailErr?.message);
    }

    res.status(201).json({ ok: true, id_receta, emailSent });
  } catch (e) {
    console.error('RECETA 500:', e?.message, e?.stack);
    res.status(500).json({ error: 'No se pudo generar/enviar la receta', details: e?.message });
  }
});

router.get('/recetas/:id/pdf', (req, res) => {
  try {
    const { id } = req.params;
    const buf = recetaStore.get(id);
    if (!buf) return res.status(404).json({ error: 'Receta expirada o no encontrada' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="receta_${id}.pdf"`);
    res.send(buf);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo servir la receta' });
  }
});

/* =====================================================
   EXPORTAR FICHA A PDF - VERSIÓN PROFESIONAL (2 PÁGS MÁX)
===================================================== */
router.get('/fichas/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT fm.*, CONCAT(p.nombres,' ',p.apellidos) AS paciente_nombre,
              p.dpi, p.telefono, p.correo, p.direccion,
              DATE_FORMAT(p.fecha_nacimiento, '%d/%m/%Y') AS fecha_nacimiento,
              DATE_FORMAT(fm.creado_en, '%d/%m/%Y') AS fecha_examen,
              DATE_FORMAT(fm.creado_en, '%H:%i') AS hora_examen
         FROM fichas_medicas fm
         JOIN pacientes p ON p.id_paciente = fm.id_paciente
        WHERE fm.id_ficha = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Ficha no encontrada' });
    const fm = rows[0];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=ficha_medica_${fm.paciente_nombre.replace(/\s+/g, '_')}_${id}.pdf`);

    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 40,
      info: {
        Title: `Ficha Medica - ${fm.paciente_nombre}`,
        Subject: 'Examen Optometrico',
        Author: 'Clinica Optica El Ancora',
        Creator: 'Sistema de Gestion Clinica'
      }
    });
    doc.pipe(res);

    // Colores
    const azulPrincipal = '#1e40af';
    const azulClaro = '#3b82f6';
    const grisOscuro = '#1f2937';
    const grisClaro = '#f8fafc';
    const verdeAccent = '#10b981';
    const rojoAccent = '#ef4444';

    let currentY = 40;

    // Encabezado
    doc.rect(0, 0, doc.page.width, 130).fill(azulPrincipal);
    try {
      const fs = await import('fs');
      const path = await import('path');
      const logoPath = path.join(process.cwd(), 'frontend', 'public', 'images', 'logo-optica.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 20, { width: 80, height: 80 });
      } else {
        throw new Error('Logo no encontrado');
      }
    } catch {
      doc.rect(50, 20, 80, 80).fill('white').stroke(azulClaro);
      doc.fontSize(11).fillColor(azulPrincipal).font('Helvetica-Bold')
         .text('EL', 73, 40, { width: 24, align: 'center' });
      doc.fontSize(9).text('ANCORA', 67, 55, { width: 36, align: 'center' });
      doc.fontSize(8).text('OPTICA', 69, 68, { width: 32, align: 'center' });
    }

    doc.fontSize(20).fillColor('white').font('Helvetica-Bold')
       .text('CLINICA OPTICA EL ANCORA', 150, 25);
    doc.fontSize(12).fillColor('white').font('Helvetica')
       .text('Centro Especializado en Salud Visual', 150, 50);
    doc.fontSize(9).fillColor('white').font('Helvetica')
       .text('Tel: +502 2232-2721 | WhatsApp: +502 4144-5224', 150, 75)
       .text('Email: clinicaelancora@gmail.com', 150, 88)
       .text('Direccion: 11 Calle 5-75, Zona 1, Guatemala', 150, 101);

    doc.rect(doc.page.width - 190, 15, 175, 100).fill('white').stroke(azulPrincipal, 2);
    doc.fontSize(11).fillColor(azulPrincipal).font('Helvetica-Bold')
       .text('FICHA MEDICA', doc.page.width - 175, 30, { width: 145, align: 'center' });
    doc.fontSize(10).fillColor(azulPrincipal).font('Helvetica-Bold')   
       .text('OPTOMETRICA', doc.page.width - 175, 44, { width: 145, align: 'center' });
    doc.fontSize(9).fillColor(grisOscuro).font('Helvetica')
       .text(`Ficha No: ${String(id).padStart(6, '0')}`, doc.page.width - 175, 62)
       .text(`Fecha: ${fm.fecha_examen}`, doc.page.width - 175, 76)
       .text(`Hora: ${fm.hora_examen}`, doc.page.width - 175, 90)
       .text('Original para archivo', doc.page.width - 175, 104);

    currentY = 150;
    function createSection(title, startY) {
      doc.rect(45, startY, doc.page.width - 90, 18)
         .fill(grisClaro).stroke(azulPrincipal, 1);
      doc.fontSize(10).fillColor(azulPrincipal).font('Helvetica-Bold')
         .text(title, 55, startY + 6);
      return startY + 28;
    }

    // Datos del paciente
    currentY = createSection('DATOS DEL PACIENTE', currentY);
    doc.fontSize(8).fillColor(grisOscuro).font('Helvetica-Bold');
    let y1 = currentY;
    doc.text('Nombre:', 50, y1).text('DPI:', 280, y1);
    doc.text('F. Nacimiento:', 50, y1 + 12).text('Telefono:', 280, y1 + 12);
    doc.text('Ocupacion:', 50, y1 + 24).text('Email:', 280, y1 + 24);
    doc.fontSize(8).fillColor('black').font('Helvetica');
    doc.text(fm.paciente_nombre || 'N/A', 90, y1);
    doc.text(fm.dpi || 'N/A', 310, y1);
    doc.text(fm.fecha_nacimiento || 'N/A', 120, y1 + 12);
    doc.text(fm.telefono || 'N/A', 320, y1 + 12);
    doc.text(fm.ocupacion || 'N/A', 95, y1 + 24);
    doc.text(fm.correo || 'N/A', 310, y1 + 24, { width: 200 });
    currentY += 50;

    // Antecedentes
    currentY = createSection('ANTECEDENTES VISUALES', currentY);
    doc.fontSize(8).fillColor(grisOscuro)
       .text('Usa anteojos:', 50, currentY)
       .text('Uso previo:', 200, currentY)
       .text('Grad. prev. OD:', 350, currentY);
    doc.fillColor(fm.usa_anteojos ? verdeAccent : rojoAccent).font('Helvetica-Bold')
       .text(fm.usa_anteojos ? 'SI' : 'NO', 120, currentY);
    doc.fillColor(fm.usa_anteojos_prev ? verdeAccent : rojoAccent)
       .text(fm.usa_anteojos_prev ? 'SI' : 'NO', 250, currentY);
    doc.fillColor('black').font('Helvetica')
       .text(fm.graduacion_od_prev || 'N/A', 430, currentY);
    doc.fontSize(8).fillColor(grisOscuro).font('Helvetica')
       .text('Grad. prev. OI:', 350, currentY + 12);
    doc.fillColor('black')
       .text(fm.graduacion_oi_prev || 'N/A', 430, currentY + 12);
    currentY += 35;

    // Agudeza
    currentY = createSection('EXAMEN DE AGUDEZA VISUAL', currentY);
    const tableY = currentY;
    doc.rect(50, tableY, 480, 40).stroke(azulPrincipal);
    doc.fontSize(8).fillColor('white').font('Helvetica-Bold');
    doc.rect(50, tableY, 480, 15).fill(azulPrincipal);
    doc.text('Tipo Examen', 60, tableY + 4);
    doc.text('O.D. (Ojo Derecho)', 200, tableY + 4);
    doc.text('O.I. (Ojo Izquierdo)', 350, tableY + 4);
    doc.fontSize(8).fillColor('black').font('Helvetica');
    doc.text('Sin correccion (S/C)', 60, tableY + 20);
    doc.text('Con correccion (C/C)', 60, tableY + 30);
    doc.text(fm.agudeza_sc_od || 'N/A', 200, tableY + 20);
    doc.text(fm.agudeza_cc_od || 'N/A', 200, tableY + 30);
    doc.text(fm.agudeza_sc_oi || 'N/A', 350, tableY + 20);
    doc.text(fm.agudeza_cc_oi || 'N/A', 350, tableY + 30);
    doc.moveTo(50, tableY + 15).lineTo(530, tableY + 15).stroke();
    doc.moveTo(50, tableY + 25).lineTo(530, tableY + 25).stroke();
    doc.moveTo(190, tableY).lineTo(190, tableY + 40).stroke();
    doc.moveTo(340, tableY).lineTo(340, tableY + 40).stroke();
    currentY += 55;

    // Prescripción final
    currentY = createSection('PRESCRIPCION OPTICA FINAL', currentY);
    const gradTableY = currentY;
    doc.rect(50, gradTableY, 480, 30).stroke(azulPrincipal);
    doc.fontSize(8).fillColor('white').font('Helvetica-Bold');
    doc.rect(50, gradTableY, 480, 12).fill(azulPrincipal);
    doc.text('Tipo Correccion', 60, gradTableY + 3);
    doc.text('O.D. (Ojo Derecho)', 200, gradTableY + 3);
    doc.text('O.I. (Ojo Izquierdo)', 350, gradTableY + 3);
    doc.fontSize(8).fillColor('black').font('Helvetica');
    doc.text('Larga Distancia', 60, gradTableY + 16);
    doc.text('Adicion (ADD)', 60, gradTableY + 24);
    doc.font('Helvetica-Bold');
    doc.text(fm.grad_final_ld_od || 'N/A', 200, gradTableY + 16);
    doc.text(fm.grad_final_add_od || 'N/A', 200, gradTableY + 24);
    doc.text(fm.grad_final_ld_oi || 'N/A', 350, gradTableY + 16);
    doc.text(fm.grad_final_add_oi || 'N/A', 350, gradTableY + 24);
    doc.moveTo(50, gradTableY + 12).lineTo(530, gradTableY + 12).stroke();
    doc.moveTo(50, gradTableY + 20).lineTo(530, gradTableY + 20).stroke();
    doc.moveTo(190, gradTableY).lineTo(190, gradTableY + 30).stroke();
    doc.moveTo(340, gradTableY).lineTo(340, gradTableY + 30).stroke();
    currentY += 45;

    // Firmas
    const spaceNeeded = 90;
    if (currentY + spaceNeeded > doc.page.height - 50) {
      doc.addPage(); currentY = 50;
    } else if (currentY < doc.page.height - 200) {
      currentY = Math.max(currentY + 20, doc.page.height - 150);
    } else {
      currentY += 20;
    }

    doc.moveTo(50, currentY).lineTo(doc.page.width - 50, currentY).stroke(azulPrincipal, 2);
    doc.fontSize(9).fillColor(grisOscuro).font('Helvetica')
       .text('_'.repeat(35), 60, currentY + 15)
       .text('_'.repeat(35), 320, currentY + 15);
    doc.fontSize(9).fillColor(azulPrincipal).font('Helvetica-Bold')
       .text('Dr. [Nombre Optometrista]', 60, currentY + 35)
       .text('Paciente / Representante', 320, currentY + 35);

    doc.end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo generar el PDF' });
  }
});

/* =====================================================
   ANALYTICS / MINI CRM
   GET /api/opto/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD&granularity=day|month
   - KPIs + series + breakdowns para dashboards
===================================================== */
router.get('/analytics', async (req, res) => {
  try {
    const id_optometrista = req.user.sub;
    const { from, to, granularity = 'day' } = req.query;

    // Rango por defecto: últimos 30 días
    const toDate   = to   ? new Date(to)   : new Date();
    const fromDate = from ? new Date(from) : new Date(Date.now() - 29 * 24 * 3600 * 1000);
    const f = (d) => d.toISOString().slice(0, 10);

    /* -------- KPIs rápidos ---------- */
    const [[kpis]] = await pool.query(
      `
      SELECT
        COUNT(*)                                                   AS citas_total,
        SUM(estado='confirmada')                                   AS citas_confirmadas,
        SUM(estado='completada')                                   AS citas_completadas,
        SUM(estado='cancelada')                                    AS citas_canceladas,
        SUM(estado='no_asistio')                                   AS citas_noshow,
        SUM(CASE WHEN estado='completada' THEN TIMESTAMPDIFF(MINUTE, inicio, fin) ELSE 0 END) AS minutos_atendidos
      FROM citas
      WHERE id_optometrista = ?
        AND DATE(inicio) BETWEEN ? AND ?
      `,
      [id_optometrista, f(fromDate), f(toDate)]
    );

    const [[pacientesNuevos]] = await pool.query(
      `
      SELECT COUNT(*) AS nuevos
      FROM pacientes
      WHERE DATE(creado_en) BETWEEN ? AND ?
      `,
      [f(fromDate), f(toDate)]
    );

    const [[withRx]] = await pool.query(
      `
      SELECT COUNT(DISTINCT r.id_cita) AS con_receta
      FROM recetas r
      JOIN citas c ON c.id_cita = r.id_cita
      WHERE c.id_optometrista = ?
        AND DATE(c.inicio) BETWEEN ? AND ?
      `,
      [id_optometrista, f(fromDate), f(toDate)]
    );

    /* -------- Serie temporal ---------- */
    const timeExpr = (granularity === 'month')
      ? "DATE_FORMAT(inicio, '%Y-%m-01')"
      : "DATE(inicio)";

    const [serie] = await pool.query(
      `
      SELECT
        ${timeExpr} AS bucket,
        COUNT(*) AS total,
        SUM(estado='confirmada') AS confirmadas,
        SUM(estado='completada') AS completadas,
        SUM(estado='cancelada')  AS canceladas
      FROM citas
      WHERE id_optometrista = ?
        AND DATE(inicio) BETWEEN ? AND ?
      GROUP BY bucket
      ORDER BY bucket ASC
      `,
      [id_optometrista, f(fromDate), f(toDate)]
    );

    /* -------- Breakdown por estado ---------- */
    const [byEstado] = await pool.query(
      `
      SELECT estado, COUNT(*) AS n
      FROM citas
      WHERE id_optometrista = ?
        AND DATE(inicio) BETWEEN ? AND ?
      GROUP BY estado
      `,
      [id_optometrista, f(fromDate), f(toDate)]
    );

    /* -------- Top motivos ---------- */
    const [topMotivos] = await pool.query(
      `
      SELECT COALESCE(motivo,'(Sin motivo)') AS motivo, COUNT(*) AS n
      FROM citas
      WHERE id_optometrista = ?
        AND DATE(inicio) BETWEEN ? AND ?
      GROUP BY COALESCE(motivo,'(Sin motivo)')
      ORDER BY n DESC
      LIMIT 8
      `,
      [id_optometrista, f(fromDate), f(toDate)]
    );

    /* -------- Productividad (minutos/día o mes) ---------- */
    const [productividad] = await pool.query(
      `
      SELECT ${timeExpr} AS bucket,
             SUM(CASE WHEN estado='completada'
                      THEN TIMESTAMPDIFF(MINUTE, inicio, fin)
                      ELSE 0 END) AS minutos
      FROM citas
      WHERE id_optometrista = ?
        AND DATE(inicio) BETWEEN ? AND ?
      GROUP BY bucket
      ORDER BY bucket ASC
      `,
      [id_optometrista, f(fromDate), f(toDate)]
    );

    /* -------- Respuesta ---------- */
    const tasaNoShow     = kpis.citas_total ? +(kpis.citas_noshow / kpis.citas_total * 100).toFixed(1) : 0;
    const tasaConReceta  = kpis.citas_completadas ? +(withRx.con_receta / kpis.citas_completadas * 100).toFixed(1) : 0;

    res.json({
      ok: true,
      range: { from: f(fromDate), to: f(toDate), granularity },
      kpis: {
        citas_total: kpis.citas_total,
        citas_confirmadas: kpis.citas_confirmadas,
        citas_completadas: kpis.citas_completadas,
        citas_canceladas: kpis.citas_canceladas,
        citas_noshow: kpis.citas_noshow,
        minutos_atendidos: kpis.minutos_atendidos,
        pacientes_nuevos: pacientesNuevos.nuevos,
        tasa_noshow_pct: tasaNoShow,
        tasa_con_receta_pct: tasaConReceta
      },
      charts: {
        serie,         // tendencia de citas por bucket
        byEstado,      // torta / barras por estado
        topMotivos,    // top motivos
        productividad  // minutos atendidos por bucket
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error: 'No se pudo generar analytics' });
  }
});

export default router;
