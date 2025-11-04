/* ------------------- Brevo API ------------------- */
async function sendViaBrevo({ to, subject, html, attachments = [] }) {
  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY no configurada');
  }

  const url = 'https://api.brevo.com/v3/smtp/email';

  // Mapear attachments a formato Brevo
  const mappedAttachments = (attachments || []).map((a) => {
    let contentBase64 = '';
    if (a?.content) {
      contentBase64 = Buffer.isBuffer(a.content)
        ? a.content.toString('base64')
        : Buffer.from(String(a.content)).toString('base64');
    }
    return { 
      name: a?.filename || a?.name || 'adjunto', 
      content: contentBase64 
    };
  });

  const FROM = process.env.SMTP_FROM || '"Clínica El Áncora" <clinicaelancora@gmail.com>';
  const senderName = (FROM.split('<')[0] || '').replace(/"/g, '').trim() || 'Clínica El Áncora';
  const senderEmail = (FROM.match(/<(.+?)>/) || [])[1] || FROM;

  const body = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    ...(mappedAttachments.length > 0 && { attachment: mappedAttachments }),
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const responseText = await res.text().catch(() => '');

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('BREVO_API_KEY inválida o expirada');
    }
    if (res.status === 400 && responseText.includes('sender')) {
      throw new Error(`Email sender '${senderEmail}' no verificado en Brevo`);
    }
    throw new Error(`Brevo ${res.status}: ${responseText}`);
  }

  const data = JSON.parse(responseText);
  console.log('📧 Enviado:', data.messageId);
  return data.messageId;
}

/* ------------------- Verificación ------------------- */
export async function verifySmtp() {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.log('⚠️ BREVO_API_KEY no configurada');
      return;
    }
    console.log('✅ Brevo API configurada correctamente');
  } catch (e) {
    console.log('⚠️ Error con Brevo API:', e.message);
  }
}

/* ------------------- Envío general ------------------- */
export async function sendMail({ to, subject, html, attachments = [] }) {
  if (!to) return;
  return await sendViaBrevo({ to, subject, html, attachments });
}

/* ------------------- Plantilla base ------------------- */
function baseTemplate({ title, intro, content, cta, footerNote }) {
  return `
  <div style="margin:0;padding:0;background:#0ea5e90d">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
      style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
      <tr><td>
        <table role="presentation" align="center" width="100%"
          style="max-width:640px;margin:0 auto;">
          <tr>
            <td style="padding:24px 20px 0 20px;text-align:center;">
              <img src="https://i.imgur.com/R6n9JZp.png" alt="Clínica El Áncora"
                width="52" height="52"
                style="border-radius:12px;display:inline-block;box-shadow:0 8px 18px rgba(14,165,233,.25)">
              <h1 style="margin:12px 0 0 0;font-size:22px;line-height:1.2;color:#0f172a">
                Clínica El Áncora
              </h1>
            </td>
          </tr>
        </table>
        <table role="presentation" align="center" width="100%"
          style="max-width:640px;margin:16px auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 16px 36px rgba(2,6,23,.08)">
          <tr><td style="background:linear-gradient(135deg,#0ea5e9,#22d3ee);height:6px"></td></tr>
          <tr>
            <td style="padding:22px 22px 8px 22px">
              <h2 style="margin:0;font-size:18px;color:#0f172a">${title}</h2>
              ${intro ? `<p style="margin:8px 0 0 0;color:#334155">${intro}</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 22px 18px 22px;color:#1f2937;font-size:15px;line-height:1.55">
              ${content || ''}
              ${cta ? `
                <div style="margin-top:16px">
                  <a href="${cta.href}"
                    style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;
                    padding:10px 16px;border-radius:999px;font-weight:700;
                    box-shadow:0 8px 18px rgba(14,165,233,.35)">
                    ${cta.label}
                  </a>
                </div>` : ''}
            </td>
          </tr>
        </table>
        <table role="presentation" align="center" width="100%"
          style="max-width:640px;margin:12px auto 24px">
          <tr>
            <td style="padding:0 20px;text-align:center;color:#64748b;font-size:12px;line-height:1.4">
              ${footerNote ||
                '11 Calle 5-75, Zona 1 · Tel. +502 2232-2721 · WhatsApp +502 4144-5224'}
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </div>`;
}

/* ------------------- Emails listos ------------------- */

// Verificación
export async function sendVerificationEmail({ to, code }) {
  const html = baseTemplate({
    title: 'Código de verificación',
    intro: 'Usa este código para continuar con el proceso:',
    content: `
      <div style="margin:10px 0 0 0;padding:12px 14px;border:1px dashed #94a3b8;
        border-radius:12px;text-align:center">
        <div style="letter-spacing:6px;font-weight:800;font-size:22px;color:#0ea5e9">${code}</div>
        <div style="margin-top:6px;color:#64748b">Caduca en <b>15 minutos</b>.</div>
      </div>`,
  });
  return sendMail({ to, subject: 'Código de verificación – Clínica El Áncora', html });
}

// Reset password
export async function sendResetEmail({ to, code }) {
  const html = baseTemplate({
    title: 'Restablecer contraseña',
    intro: 'Recibimos una solicitud para cambiar tu contraseña.',
    content: `
      <p>Ingresa este código en la aplicación:</p>
      <div style="margin:8px 0 0 0;padding:12px 14px;border:1px dashed #94a3b8;
        border-radius:12px;text-align:center">
        <div style="letter-spacing:6px;font-weight:800;font-size:22px;color:#0ea5e9">${code}</div>
        <div style="margin-top:6px;color:#64748b">Caduca en <b>5 minutos</b>.</div>
      </div>
      <p style="margin-top:10px;color:#64748b">Si no fuiste tú, ignora este mensaje.</p>`,
  });
  return sendMail({ to, subject: 'Restablecer contraseña – Clínica El Áncora', html });
}

// Cita confirmada
export async function sendAppointmentConfirmed({ to, nombre, fecha, tramo }) {
  const html = baseTemplate({
    title: '✅ Cita confirmada',
    intro: `Hola ${nombre || 'paciente'}, tu cita ha sido confirmada.`,
    content: `
      <ul style="list-style:none;padding:0;margin:0">
        <li><b>Fecha:</b> ${fecha}</li>
        <li><b>Horario:</b> ${tramo}</li>
        <li><b>Dirección:</b> 11 Calle 5-75, Zona 1</li>
      </ul>
      <p style="margin-top:10px;color:#64748b">Por favor llega 5–10 minutos antes.</p>`,
  });
  return sendMail({ to, subject: 'Cita confirmada – Clínica El Áncora', html });
}

// Cita cancelada
export async function sendAppointmentCanceled({ to, nombre, fecha, tramo, motivo }) {
  const html = baseTemplate({
    title: '❌ Cita cancelada',
    intro: `Hola ${nombre || 'paciente'}, tu cita fue cancelada.`,
    content: `
      <ul style="list-style:none;padding:0;margin:0">
        <li><b>Fecha:</b> ${fecha}</li>
        <li><b>Horario:</b> ${tramo}</li>
        ${motivo ? `<li><b>Motivo:</b> ${motivo}</li>` : ''}
      </ul>
      <p style="margin-top:10px">Puedes reprogramar desde la web o escribirnos por WhatsApp.</p>`,
  });
  return sendMail({ to, subject: 'Cita cancelada – Clínica El Áncora', html });
}

// Enviar receta con PDF adjunto
export async function sendRecipeEmail({ to, nombre, id_receta, pdfBuffer }) {
  const html = baseTemplate({
    title: '📄 Tu receta está lista',
    intro: `Hola ${nombre || 'paciente'}, adjuntamos tu receta en PDF.`,
    content: `
      <p>Puedes descargarla y presentarla en óptica.</p>
      <p style="margin-top:8px;color:#64748b">Si necesitas algún ajuste, respóndenos este correo.</p>`,
  });
  return sendMail({
    to,
    subject: 'Tu receta – Clínica El Áncora',
    html,
    attachments: [{ filename: `receta_${id_receta}.pdf`, content: pdfBuffer }],
  });
}
