import { format } from "date-fns";
import { es } from "date-fns/locale";

const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN?.trim();
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || "15551623346";

/** Datos necesarios para armar el recordatorio (compatible con MySQL o cualquier fuente) */
export interface ReminderAppointmentData {
  startAt: Date;
  patient: { name: string; phone?: string | null };
  professional: { name: string };
  location: { name: string };
  serviceName?: string | null;
}

/** Variables para el mensaje por defecto del recordatorio */
export interface DefaultReminderVars {
  nombre_cliente: string;
  lugar: string;
  servicio: string;
  profesional: string;
  fecha: string;
  hora: string;
}

const DEFAULT_REMINDER_TEMPLATE = `Hola {{nombre_cliente}} ✨
Ya casi es tu turno en {{lugar}}.

🧑‍🎨 {{servicio}} con {{profesional}}
📅 {{fecha}} a las {{hora}}

Si necesitás hacer algún cambio, podés gestionarlo desde tu cuenta.
¡Nos vemos pronto!`;

/**
 * Genera el mensaje de recordatorio por defecto reemplazando las variables.
 * Variables: nombre_cliente, lugar, servicio, profesional, fecha, hora.
 */
export function getDefaultReminderMessage(vars: DefaultReminderVars): string {
  return DEFAULT_REMINDER_TEMPLATE
    .replace(/\{\{nombre_cliente\}\}/g, vars.nombre_cliente)
    .replace(/\{\{lugar\}\}/g, vars.lugar)
    .replace(/\{\{servicio\}\}/g, vars.servicio)
    .replace(/\{\{profesional\}\}/g, vars.profesional)
    .replace(/\{\{fecha\}\}/g, vars.fecha)
    .replace(/\{\{hora\}\}/g, vars.hora);
}

/**
 * Arma las variables por defecto a partir de un appointment.
 */
export function getDefaultReminderVars(data: ReminderAppointmentData): DefaultReminderVars {
  const startAt = data.startAt instanceof Date ? data.startAt : new Date(data.startAt);
  const dateStr = format(startAt, "EEEE d 'de' MMMM", { locale: es });
  const timeStr = format(startAt, "HH:mm");
  return {
    nombre_cliente: data.patient.name || "Cliente",
    lugar: data.location.name || "—",
    servicio: data.serviceName || "Turno",
    profesional: data.professional.name || "el profesional",
    fecha: dateStr,
    hora: timeStr,
  };
}

/**
 * Envía un recordatorio por WhatsApp al paciente.
 * Usa WHATSAPP_API_TOKEN y WHATSAPP_PHONE_NUMBER_ID (número de prueba: 15551623346).
 * Si se pasa customMessage se envía ese texto; si no, se usa el mensaje por defecto con las variables.
 */
export async function sendWhatsAppReminder(
  data: ReminderAppointmentData,
  patientPhoneNumber: string,
  customMessage?: string | null
): Promise<boolean> {
  if (!WHATSAPP_API_TOKEN) {
    console.error("[WhatsApp] WHATSAPP_API_TOKEN no configurado.");
    return false;
  }
  if (!WHATSAPP_PHONE_NUMBER_ID) {
    console.error("[WhatsApp] WHATSAPP_PHONE_NUMBER_ID no configurado.");
    return false;
  }

  const messageBody =
    customMessage?.trim() ||
    getDefaultReminderMessage(getDefaultReminderVars(data));

  const body = {
    messaging_product: "whatsapp",
    to: patientPhoneNumber.replace(/\D/g, ""),
    type: "text",
    text: { body: messageBody },
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("[WhatsApp] Error:", response.status, err);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[WhatsApp] Exception:", error);
    return false;
  }
}
