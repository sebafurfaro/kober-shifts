import nodemailer from "nodemailer";

/** Variables para el mensaje de turno confirmado (paciente) */
export type TurnoConfirmadoPacienteVars = {
  profesional: string;
  fechaHora: string;
  sede: string;
};

/** Genera el texto y el HTML del cuerpo del email de "turno confirmado" para el paciente. */
export function getTurnoConfirmadoPacienteContent(v: TurnoConfirmadoPacienteVars) {
  const sentence = `El turno con ${v.profesional} para el día ${v.fechaHora} en ${v.sede} ha sido confirmado.`;
  const text = `Tu turno fue confirmado.\n\n${sentence}`;
  const bodyHtml = `<p>Tu turno fue confirmado.</p><p>${sentence}</p><p><strong>Sede:</strong> ${v.sede}<br/><strong>Fecha y hora:</strong> ${v.fechaHora}</p>`;
  return { text, bodyHtml, preview: sentence };
}

/** Variables para el mensaje de turno confirmado (profesional) */
export type TurnoConfirmadoProfesionalVars = {
  pacienteNombre: string;
  pacienteEmail: string;
  sede: string;
  fechaHora: string;
};

/** Genera el texto y el HTML del cuerpo del email de "turno confirmado" para el profesional. */
export function getTurnoConfirmadoProfesionalContent(v: TurnoConfirmadoProfesionalVars) {
  const text = `Turno confirmado.\n\nPaciente: ${v.pacienteNombre} (${v.pacienteEmail})\nSede: ${v.sede}\nInicio: ${v.fechaHora}`;
  const bodyHtml = `<p>Turno confirmado.</p><p><strong>Paciente:</strong> ${v.pacienteNombre} (${v.pacienteEmail})<br/><strong>Sede:</strong> ${v.sede}<br/><strong>Inicio:</strong> ${v.fechaHora}</p>`;
  return { text, bodyHtml, preview: "Turno confirmado." };
}

export function renderBasicTemplate(input: {
  title: string;
  preview?: string;
  body: string;
  footer?: string;
}) {
  const previewText = input.preview ? input.preview : input.body;
  const footerText = input.footer ?? "NODO App";
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${input.title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${previewText}
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding:24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;box-shadow:0 6px 24px rgba(15,23,42,0.08);">
            <tr>
              <td style="padding:24px 28px 12px;">
                <h1 style="margin:0;font-size:20px;line-height:28px;color:#0e5287;">${input.title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 24px;font-size:14px;line-height:20px;color:#1f2937;">
                ${input.body}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 24px;border-top:1px solid #e2e8f0;font-size:12px;line-height:18px;color:#64748b;">
                ${footerText}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendMail(input: { to: string; subject: string; text: string; html?: string }) {
  const resendKey = process.env.RESEND_API_KEY;
  const smtpFrom = process.env.SMTP_FROM || "no-reply@example.com";
  const resendFrom = process.env.RESEND_FROM || smtpFrom || "no-reply@resend.dev";

  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
          "User-Agent": process.env.RESEND_USER_AGENT || "kober-shifts/1.0",
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [input.to],
          subject: input.subject,
          text: input.text,
          html: input.html,
        }),
      });
      if (res.ok) {
        return;
      }
      const errBody = await res.text().catch(() => "");
      console.error("Resend send error:", res.status, errBody);
    } catch (error) {
      console.error("Resend send exception:", error);
    }
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = smtpFrom;

  if (!host || !user || !pass) {
    // For dev: allow running without SMTP configured.
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}


