import { Appointment, User, Location } from "@prisma/client";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";

// Environment variables
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN || "EAARbt62OYhUBQ6QiUsfz3DKGS707j8xZBflI0DPt6ZCy10hGTAinUQ4ktQIvV6pfkCDNUZBk0oiHirwNqMyzsUnFoCcGlWhtaOfEQeZBDIK1pAtQHnBVnZAqpD95hklaZA5FCb1n9ANRCdgZBw5CI40V8kLDQMvxVNdlSXaZBi74m6IM6epjLBZA9BaqFNplkQ6wZAFO36uxVWsAF4ZADZAqtuMO9WcYVpgtix8Rj9HZCPDmtNJEcKURb9C2LeiWd8ZCrhEud5anNx6ZCPt3avAn79PC9Q06v1M1QZDZD";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

/**
 * Sends a WhatsApp reminder to a user.
 * 
 * Default Template: "recordatorio_turno_v2" (or similar)
 * The message according to the doc:
 * Hola {{1}} ✨
 * Ya casi es tu turno en {{2}}.
 * 
 * 🧑‍🎨 {{3}} con {{4}}
 * 📅 {{5}} a las {{6}}
 * 
 * Si necesitás hacer algún cambio, podés gestionarlo desde tu cuenta.
 * ¡Nos vemos pronto!
 * 
 * @param appointment - The appointment object with included relations
 * @param patientPhoneNumber - The properly formatted phone number (e.g., "54911...")
 * @param customMessage - Optional dynamic message text. If provided, sends as a text message instead of template (Note: may fail for business-initiated if outside 24h window)
 */
export async function sendWhatsAppReminder(
  appointment: Appointment & {
    patient: User;
    professional: User;
    location: Location;
  },
  patientPhoneNumber: string,
  customMessage?: string
): Promise<boolean> {
  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.error("WhatsApp credentials (API Token or Phone Number ID) not found.");
    return false;
  }

  const dateStr = format(appointment.startAt, "EEEE d 'de' MMMM", { locale: es });
  const timeStr = format(appointment.startAt, "HH:mm");

  let body: any;

  if (customMessage) {
    // If a custom message is provided, we try to send it as text. 
    // WARNING: This only works for business-initiated if there's an open session, 
    // or if the account has special permissions. Otherwise, templates must be used.
    body = {
      messaging_product: "whatsapp",
      to: patientPhoneNumber,
      type: "text",
      text: { body: customMessage },
    };
  } else {
    // Default template approach
    body = {
      messaging_product: "whatsapp",
      to: patientPhoneNumber,
      type: "template",
      template: {
        name: "recordatorio_turno_v2", // Updated template name to differentiate
        language: { code: "es" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: appointment.patient.name }, // {{1}} nombre_cliente
              { type: "text", text: appointment.location.name }, // {{2}} lugar
              { type: "text", text: "Turno" }, // {{3}} servicio (antes especialidad)
              { type: "text", text: appointment.professional.name }, // {{4}} profesional
              { type: "text", text: dateStr }, // {{5}} fecha
              { type: "text", text: timeStr }, // {{6}} hora
            ],
          },
        ],
      },
    };
  }

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
      const errorData = await response.json();
      console.error("Error sending WhatsApp message:", errorData);
      return false;
    }

    const data = await response.json();
    console.log("WhatsApp message sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Exception sending WhatsApp message:", error);
    return false;
  }
}

