import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import url from 'url';

const router = Router();

// Solo Optometrista
router.use(requireAuth, requireRole(2));

/* ===================== Helpers comunes ===================== */
async function getPaciente(id_paciente) {
  const [rows] = await pool.query(
    'SELECT id_paciente, nombres, apellidos FROM pacientes WHERE id_paciente=?',
    [id_paciente]
  );
  return rows[0] || null;
}

function drawLabel(doc, x, y, label, value, w = 180) {
  doc.font('Helvetica-Bold').fontSize(9).text(label, x, y);
  if (value !== undefined && value !== null && value !== '') {
    doc.font('Helvetica').fontSize(10).text(String(value), x, y + 12, { width: w });
  }
}
function drawCheckbox(doc, x, y, label, checked) {
  doc.rect(x, y, 10, 10).stroke();
  if (checked) {
    doc.moveTo(x, y).lineTo(x + 10, y + 10).moveTo(x + 10, y).lineTo(x, y + 10).stroke();
  }
  doc.font('Helvetica').fontSize(10).text(label, x + 14, y - 2);
}
function sectionTitle(doc, title, y, width = 540) {
  doc.font('Helvetica-Bold').fontSize(12).text(title, 36, y);
  doc.moveTo(36, y + 16).lineTo(36 + width, y + 16).stroke();
  return y + 24;
}
function drawGridBox(doc, x, y, w, h) {
  doc.roundedRect(x, y, w, h, 6).strokeColor('#d9d9d9').stroke().strokeColor('#000');
}

/* ===================== Listar / Buscar ===================== */
// GET /api/opto/fichas?paciente=ID&q=texto
router.get('/opto/fichas', async (req, res) => {
  try {
    const { paciente, q = '' } = req.query;
    const params = [];
    let sql = `
      SELECT fm.*, CONCAT(p.nombres,' ',p.apellidos) AS paciente_nombre
        FROM fichas_medicas fm
        JOIN pacientes p ON p.id_paciente = fm.id_paciente
       WHERE 1=1
    `;
    if (paciente) {
      sql += ' AND fm.id_paciente = ?';
      params.push(paciente);
    }
    if (q) {
      sql += `
        AND (
          LOWER(fm.tratamiento_diagnostico) LIKE ?
          OR LOWER(p.nombres) LIKE ?
          OR LOWER(p.apellidos) LIKE ?
        )`;
      const s = `%${q.toLowerCase()}%`;
      params.push(s, s, s);
    }
    sql += ' ORDER BY fm.id_ficha DESC LIMIT 200';

    const [rows] = await pool.query(sql, params);
    res.json({ ok: true, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudieron obtener las fichas' });
  }
});

/* ========================= Obtener ========================= */
// GET /api/opto/fichas/:id
router.get('/opto/fichas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM fichas_medicas WHERE id_ficha=?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Ficha no encontrada' });
    res.json({ ok: true, data: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo obtener la ficha' });
  }
});

/* ========================= Crear =========================== */
// POST /api/opto/fichas
router.post('/opto/fichas', async (req, res) => {
  try {
    const id_optometrista = req.user.sub;
    const { id_paciente, ...campos } = req.body;
    if (!id_paciente) return res.status(400).json({ error: 'Paciente requerido' });

    const pac = await getPaciente(id_paciente);
    if (!pac) return res.status(404).json({ error: 'Paciente no existe' });

    const [result] = await pool.query(
      `INSERT INTO fichas_medicas SET ?`,
      [{ id_paciente, id_optometrista, ...campos }]
    );
    res.status(201).json({ ok: true, id_ficha: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo crear la ficha' });
  }
});

/* ======================== Actualizar ======================= */
// PUT /api/opto/fichas/:id
router.put('/opto/fichas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const campos = { ...req.body };
    delete campos.id_ficha;
    delete campos.id_optometrista;

    await pool.query(`UPDATE fichas_medicas SET ? WHERE id_ficha=?`, [campos, id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo actualizar la ficha' });
  }
});

/* =================== Habilitar / Inhabilitar ================== */
// PATCH /api/opto/fichas/:id/activo  { activo: 0|1 }
router.patch('/opto/fichas/:id/activo', async (req, res) => {
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

/* ====================== Exportar a PDF ====================== */
// GET /api/opto/fichas/:id/pdf
router.get('/opto/fichas/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;

    // Ficha + Paciente + Optometrista
    const [rows] = await pool.query(
      `
      SELECT fm.*,
             p.nombres, p.apellidos, p.dpi,
             DATE_FORMAT(p.fecha_nacimiento,'%Y-%m-%d') AS fecha_nacimiento,
             u.usuario AS optometrista
        FROM fichas_medicas fm
        JOIN pacientes p ON p.id_paciente = fm.id_paciente
        JOIN usuarios  u ON u.id_usuario  = fm.id_optometrista
       WHERE fm.id_ficha = ?
      `,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Ficha no encontrada' });
    const f = rows[0];

    // PDF
    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    const filename = `ficha_${id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    doc.pipe(res);

    // Logo (desde backend/public/images/logo-optica.png)
    try {
      const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
      const logoPath = path.join(__dirname, '../../public/images/logo-optica.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 36, 28, { width: 42, height: 42 });
      }
    } catch {}

    // Encabezado
    doc.font('Helvetica-Bold').fontSize(16).text('Clínica El Áncora', 90, 30);
    doc.font('Helvetica').fontSize(10).fillColor('#555').text('Ficha Médica Optométrica', 90, 48);
    doc.fillColor('#000');

    // Caja datos Paciente
    drawGridBox(doc, 36, 80, 540, 72);
    drawLabel(doc, 48, 88, 'Paciente', `${f.nombres || ''} ${f.apellidos || ''}`);
    drawLabel(doc, 300, 88, 'DPI', f.dpi || '-');
    drawLabel(doc, 48, 110, 'Fecha de nacimiento', f.fecha_nacimiento || '-');
    drawLabel(doc, 300, 110, 'Atendido por', f.optometrista || '-');

    // Encabezado Ficha
    let y = sectionTitle(doc, 'Encabezado', 164);
    drawGridBox(doc, 36, y - 8, 540, 68);
    drawLabel(doc, 48, y, 'Ocupación', f.ocupacion || '-', 230);
    drawCheckbox(doc, 300, y, 'Usa anteojos', !!f.usa_anteojos);
    drawCheckbox(doc, 420, y, 'No usa ant.', !!f.usa_anteojos_prev);
    y += 28;
    drawLabel(doc, 48, y, 'Graduación previa O.D.', f.graduacion_od_prev || '-');
    drawLabel(doc, 300, y, 'Graduación previa O.I.', f.graduacion_oi_prev || '-');

    // Antecedentes y Síntomas
    y = sectionTitle(doc, 'Antecedentes y Síntomas', y + 32);
    drawGridBox(doc, 36, y - 8, 540, 112);
    let col1 = 48, col2 = 300, yy = y;
    [
      ['Cefalea', f.cefalea],
      ['Ardor ocular', f.ardor_ocular],
      ['Prurito', f.prurito],
      ['Es diabético', f.es_diabetico],
      ['Dolor ocular', f.dolor_ocular],
      ['Epífora (lagrimeo)', f.epifora],
      ['Moscas volantes', f.moscas_volantes],
      ['Es hipertenso', f.es_hipertenso],
      ['Fotofobia', f.fotofobia],
      ['Sombras', f.sombras],
      ['Halos', f.halos],
      ['Hay embarazo', f.hay_embarazo],
    ].forEach((it, i) => {
      const x = i % 2 === 0 ? col1 : col2;
      if (i % 2 === 0 && i > 0) yy += 18;
      drawCheckbox(doc, x, yy, it[0], !!it[1]);
    });
    yy += 24;
    drawLabel(doc, 48, yy, 'Antecedentes familiares', f.antecedentes_familiares || '-', 500);

    // Otros
    y = sectionTitle(doc, 'Otros', yy + 34);
    drawGridBox(doc, 36, y - 8, 540, 90);
    drawLabel(doc, 48, y, 'Tratamiento actual', f.tratamiento_actual || '-', 500);
    y += 28;
    drawLabel(doc, 48, y, 'AV sin corrección O.D.', f.agudeza_sc_od || '-');
    drawLabel(doc, 300, y, 'AV sin corrección O.I.', f.agudeza_sc_oi || '-');
    y += 20;
    drawLabel(doc, 48, y, 'AV con corrección ant. O.D.', f.agudeza_cc_od || '-');
    drawLabel(doc, 300, y, 'AV con corrección ant. O.I.', f.agudeza_cc_oi || '-');

    // Oftalmoscopía
    y = sectionTitle(doc, 'Oftalmoscopía', y + 36);
    drawGridBox(doc, 36, y - 8, 540, 84);
    drawCheckbox(doc, 48, y, 'N.L.', !!f.oftalmoscopia_nl);
    drawCheckbox(doc, 120, y, 'No normal', !!f.oftalmoscopia_no_normal);
    y += 22;
    drawLabel(doc, 48, y, 'Consideraciones O.D.', f.consideraciones_od || '-', 500);
    y += 26;
    drawLabel(doc, 48, y, 'Consideraciones O.I.', f.consideraciones_oi || '-', 500);

    // Retinoscopía
    y = sectionTitle(doc, 'Retinoscopía', y + 42);
    drawGridBox(doc, 36, y - 8, 540, 52);
    drawLabel(doc, 48, y, 'O.D.', f.retinoscopia_od || '-');
    drawLabel(doc, 300, y, 'O.I.', f.retinoscopia_oi || '-');

    // Subjetivo
    y = sectionTitle(doc, 'Subjetivo', y + 38);
    drawGridBox(doc, 36, y - 8, 540, 84);
    yy = y;
    drawLabel(doc, 48, yy, 'Test Bicromático');
    drawCheckbox(doc, 160, yy, 'Sí', !!f.test_bicromatico_s);
    drawCheckbox(doc, 210, yy, 'No', !!f.test_bicromatico_n);
    drawLabel(doc, 300, yy, 'Cilindros Cruzados');
    drawCheckbox(doc, 430, yy, 'Sí', !!f.cilindros_cruzados_s);
    drawCheckbox(doc, 480, yy, 'No', !!f.cilindros_cruzados_n);
    yy += 22;
    drawLabel(doc, 48, yy, 'Bastón de Madox');
    drawCheckbox(doc, 160, yy, 'Sí', !!f.baston_madox_s);
    drawCheckbox(doc, 210, yy, 'No', !!f.baston_madox_n);
    yy += 22;
    drawLabel(doc, 48, yy, 'Forias', f.forias || '-', 220);
    drawLabel(doc, 300, yy, 'Tropias', f.tropias || '-', 220);

    // Graduación final
    y = sectionTitle(doc, 'Graduación Final', yy + 38);
    drawGridBox(doc, 36, y - 8, 540, 70);
    drawLabel(doc, 48, y, 'Larga distancia O.D.', f.grad_final_ld_od || '-', 220);
    drawLabel(doc, 300, y, 'Larga distancia O.I.', f.grad_final_ld_oi || '-', 220);
    y += 26;
    drawLabel(doc, 48, y, 'ADD Visión cercana O.D.', f.grad_final_add_od || '-', 220);
    drawLabel(doc, 300, y, 'ADD Visión cercana O.I.', f.grad_final_add_oi || '-', 220);

    // Tratamiento y diagnóstico
    y = sectionTitle(doc, 'Tratamiento y Diagnóstico', y + 40);
    drawGridBox(doc, 36, y - 8, 540, 90);
    doc.font('Helvetica').fontSize(10).text(f.tratamiento_diagnostico || '-', 48, y, { width: 510 });

    // Footer
    doc.fontSize(8).fillColor('#666');
    doc.text(`Generado: ${new Date().toLocaleString()}`, 36, 812);
    doc.text(`ID ficha: ${id}`, 500, 812, { width: 72, align: 'right' });

    doc.end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo generar el PDF' });
  }
});

export default router;
