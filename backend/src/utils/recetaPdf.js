import PDFDocument from 'pdfkit';
import streamBuffers from 'stream-buffers';

export async function buildRecetaPDF(receta, clinica = {}) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const writableStream = new streamBuffers.WritableStreamBuffer();

  doc.pipe(writableStream);

  // Marco exterior
  doc.roundedRect(30, 30, doc.page.width - 60, doc.page.height - 60, 10).stroke('#333');

  // Encabezado
  doc.font('Helvetica-Bold').fontSize(18).text('EL ANCORA CENTRO OPTICO', 0, 50, { align: 'center' });
  doc.font('Helvetica').fontSize(10).text('11 CALLE 5-75 ZONA 1 CENTRO HISTORICO GUATEMALA', { align: 'center' });
  doc.text('TELEFONO: 2232-2721     WhatsApp: 4144-5224', { align: 'center' });
  doc.moveDown(0.4);
  doc.font('Helvetica-Bold').text('ALFONSO BARAHONA', { align: 'center' });
  doc.font('Helvetica').text('OPTOMETRISTA', { align: 'center' });

  // Datos
  const y0 = 140;
  doc.fontSize(10).text(`FECHA: ${receta.fecha}`, 60, y0);
  doc.text(`PACIENTE: ${receta.paciente_nombre || 'N/D'}`, 60, y0 + 18);

  // Cabecera de tabla
  const yTable = y0 + 55;
  const xCol = [110, 220, 310, 390, 460, 530]; // ESF, CIL, EJE, D.P., COLOR, ADD
  doc.font('Helvetica-Bold');
  doc.text('ESF',  xCol[0], yTable);
  doc.text('CIL',  xCol[1], yTable);
  doc.text('EJE',  xCol[2], yTable);
  doc.text('D.P.', xCol[3], yTable);
  doc.text('COLOR',xCol[4], yTable);
  doc.text('ADD.', xCol[5], yTable);

  // Caja grande
  const boxW = 520, boxH = 90, boxX = 60, boxY = yTable + 12;
  doc.roundedRect(boxX, boxY, boxW, boxH, 10).stroke('#333');

  doc.font('Helvetica-Bold').fontSize(12);
  doc.text('OD', boxX + 10, boxY + 12);
  doc.text('OI', boxX + 10, boxY + 52);

  doc.font('Helvetica').fontSize(11);
  doc.text(receta.od_esf || '', xCol[0], boxY + 12);
  doc.text(receta.od_cil || '', xCol[1], boxY + 12);
  doc.text(receta.od_eje || '', xCol[2], boxY + 12);
  doc.text(receta.od_dp  || '', xCol[3], boxY + 12);
  doc.text(receta.od_color || '', xCol[4], boxY + 12);
  doc.text(receta.od_add || '', xCol[5], boxY + 12);

  doc.text(receta.oi_esf || '', xCol[0], boxY + 52);
  doc.text(receta.oi_cil || '', xCol[1], boxY + 52);
  doc.text(receta.oi_eje || '', xCol[2], boxY + 52);
  doc.text(receta.oi_dp  || '', xCol[3], boxY + 52);
  doc.text(receta.oi_color || '', xCol[4], boxY + 52);
  doc.text(receta.oi_add || '', xCol[5], boxY + 52);

  // Observaciones
  const yObs = boxY + boxH + 30;
  doc.font('Helvetica-Bold').fontSize(11).text('OBSERVACIONES:', 60, yObs);
  doc.font('Helvetica').fontSize(10).text(receta.observaciones || '', 60, yObs + 16, {
    width: doc.page.width - 120
  });

  // Firma
  const yFirma = doc.page.height - 120;
  doc.moveTo(420, yFirma).lineTo(doc.page.width - 60, yFirma).stroke('#333');
  doc.font('Helvetica').fontSize(10).text('Dr. __________________________', 420, yFirma + 8);

  doc.end();
  await new Promise((r) => doc.on('end', r));

  return writableStream.getBuffer();
}
