import { NextResponse } from "next/server";
import { getMercadoPagoAccountWithRefresh } from "@/lib/mercadopago-accounts";
import { findAppointmentById, updateAppointment, findUserById, findLocationById } from "@/lib/db";
import { markLocalPaymentAsApproved, updateLocalPaymentStatusByPreferenceOrAppointment } from "@/lib/mercadopago-payments";
import { AppointmentStatus } from "@/lib/types";
import { getTenantSettingsRow } from "@/lib/settings-db";
import { renderBasicTemplate, sendMail, getTurnoConfirmadoPacienteContent, formatLocationAddress } from "@/lib/email";
import { formatInBuenosAires, mysqlDateToUTC } from "@/lib/timezone";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const tenantId = url.searchParams.get("tenantId");
    const initAppointmentId = url.searchParams.get("appointmentId");

    const body = await req.json();

    // Mercado Pago manda el ID del payment en body.data.id cuando type === 'payment' (o action === 'payment.created' / 'payment.updated')
    const type = url.searchParams.get("type") || body.type;
    const topic = url.searchParams.get("topic") || body.topic;
    
    // Si no es un evento de pago, retornamos 200 para que MP no reintente
    if (type !== "payment" && topic !== "payment") {
      return NextResponse.json({ status: "ignored" });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return NextResponse.json({ status: "ignored" });
    }

    if (!tenantId) {
      console.warn("Webhook MP sin tenantId", body);
      return NextResponse.json({ status: "ignored" });
    }

    // Buscamos las credenciales del tenant para acceder a dicho pago
    const account = await getMercadoPagoAccountWithRefresh(tenantId);
    if (!account || !account.accessToken) {
      console.error("Vendedora (Tenant) no conectada o sin token", tenantId);
      return NextResponse.json({ status: "error" }, { status: 400 });
    }

    // Consultar el endpoint de Pagos de MP
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
      },
    });

    if (!response.ok) {
      console.error("Error validando el pago en MP", await response.text());
      return NextResponse.json({ status: "error", message: "Failed to validate payment" }, { status: 400 });
    }

    const paymentData = await response.json();
    const status = paymentData.status; // 'approved', 'rejected', 'pending', etc
    const appointmentId = paymentData.external_reference || initAppointmentId;

    if (!appointmentId) {
      console.error("No se determinó el appointmentId para el pago", paymentId);
      return NextResponse.json({ status: "ignored" });
    }

    await updateLocalPaymentStatusByPreferenceOrAppointment(appointmentId, paymentId, status);

    if (status === "approved") {
      // Actualizamos el estado del turno
      const appointment = await findAppointmentById(appointmentId, tenantId);
      if (appointment && appointment.status === AppointmentStatus.PENDING_DEPOSIT) {
        
        await updateAppointment({
          id: appointmentId,
          tenantId,
          status: AppointmentStatus.CONFIRMED,
        });

        // Verificamos settings para mandar email
        const settingsRow = await getTenantSettingsRow(tenantId).catch(() => null);
        const settings =
          settingsRow?.settings && typeof settingsRow.settings === "object"
            ? (settingsRow.settings as Record<string, unknown>)
            : {};
        
        const sendEmailConfirmation = settings.sendEmailConfirmation === true;
        
        if (sendEmailConfirmation) {
          const patient = await findUserById(appointment.patientId, tenantId);
          const professional = await findUserById(appointment.professionalId, tenantId);
          const location = await findLocationById(appointment.locationId, tenantId);
          
          if (patient && professional && location && patient.email) {
            const startFormatted = formatInBuenosAires(mysqlDateToUTC(appointment.startAt), "dd/MM/yyyy HH:mm");
            const pacienteContent = getTurnoConfirmadoPacienteContent({
              profesional: professional.name,
              fechaHora: startFormatted,
              sede: location.name,
              sedeAddress: formatLocationAddress(location),
            });
            await sendMail({
              to: patient.email,
              subject: "Turno confirmado - Pago recibido",
              text: pacienteContent.text,
              html: renderBasicTemplate({
                title: "Turno confirmado - Pago recibido",
                preview: pacienteContent.preview,
                body: pacienteContent.bodyHtml,
              }),
            }).catch(console.error);

            if (professional.email) {
              await sendMail({
                to: professional.email,
                subject: "Turno confirmado por pago",
                text: `El turno de ${patient.name || 'Paciente'} (Sede: ${location.name}) acaba de ser confirmado por el pago correspondiente.`,
                html: renderBasicTemplate({
                  title: "Turno confirmado por pago",
                  preview: "Pago recibido exitosamente",
                  body: `<p>El turno de <strong>${patient.name || 'Paciente'}</strong> ha sido confirmado exitosamente mediante pago online.</p>
                         <p><strong>Sede:</strong> ${location.name}<br/>
                         <strong>Inicio:</strong> ${startFormatted}</p>`,
                }),
              }).catch(console.error);
            }
          }
        }
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Error processing Mercado Pago Webhook", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
