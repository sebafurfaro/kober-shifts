
import { Appointment, User, Location } from "@prisma/client";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";

// Environment variables
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

/**
 * Sends a WhatsApp reminder template message to a user.
 * 
 * Template: "recordatorio_turno" (must be created in Meta Business Manager)
 * Variables assumed:
 * {{1}}: Name of the patient
 * {{2}}: Date of appointment (e.g., "Lunes 10 de Marzo")
 * {{3}}: Time of appointment (e.g., "14:30")
 * {{4}}: Professional's name
 * 
 * @param appointment - The appointment object with included relations
 * @param patientPhoneNumber - The properly formatted phone number (e.g., "54911...")
 */
export async function sendWhatsAppReminder(
  appointment: Appointment & {
    patient: User;
    professional: User;
    location: Location;
  },
  patientPhoneNumber: string
): Promise<boolean> {
  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.error("WhatsApp credentials not found in environment variables.");
    return false;
  }

  // Format date and time in Spanish
  // Note: appointment.startAt is a Date object. 
  // If the app correctly handles it as a JS Date object representing the time,
  // we can use standard formatting.
  // Ideally, we should use the timezone utils from lib/timezone if needed,
  // but for formatting output 'date-fns' with locale 'es' is good.
  
  const dateStr = format(appointment.startAt, "EEEE d 'de' MMMM", { locale: es });
  const timeStr = format(appointment.startAt, "HH:mm");

  const body = {
    messaging_product: "whatsapp",
    to: patientPhoneNumber,
    type: "template",
    template: {
      name: "recordatorio_turno", // MUST MATCH META TEMPLATE NAME
      language: {
        code: "es", // MUST MATCH TEMPLATE LANGUAGE
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: appointment.patient.name, // {{1}}
            },
            {
              type: "text",
              text: dateStr, // {{2}}
            },
            {
              type: "text",
              text: timeStr, // {{3}}
            },
            {
              type: "text",
              text: appointment.professional.name, // {{4}}
            },
          ],
        },
      ],
    },
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
      const errorData = await response.json();
      console.error("Error sending WhatsApp message:", errorData);
      return false;
    }

    const data = await response.json();
    console.log("WhatsApp message sent:", data);
    return true;
  } catch (error) {
    console.error("Exception sending WhatsApp message:", error);
    return false;
  }
}
