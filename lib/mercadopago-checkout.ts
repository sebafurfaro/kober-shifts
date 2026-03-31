import { getMercadoPagoAccountWithRefresh } from "./mercadopago-accounts";
import { Service, Appointment } from "./types";

export interface PreferenceData {
  appointmentId: string;
  tenantId: string;
  amount: number;
  serviceName: string;
  patientEmail: string;
  patientName: string;
  baseUrl: string;
}

export async function createAppointmentPreference(data: PreferenceData) {
  const account = await getMercadoPagoAccountWithRefresh(data.tenantId);
  if (!account || !account.accessToken) {
    throw new Error("MERCADOPAGO_NOT_LINKED");
  }

  const payload = {
    items: [
      {
        id: data.appointmentId,
        title: `Reserva de Turno: ${data.serviceName.substring(0, 200)}`,
        quantity: 1,
        unit_price: Number(data.amount.toFixed(2)),
        currency_id: "ARS",
      },
    ],
    payer: {
      email: data.patientEmail,
      name: data.patientName || "Paciente",
    },
    payment_methods: {
      excluded_payment_types: [
        { id: "ticket" }, // Excluir Rapipago/PagoFacil para que sea online al instante
      ],
      installments: 1, // Sin cuotas preferiblemente, o max_installments: 1
    },
    back_urls: {
      success: `${data.baseUrl}/plataforma/${data.tenantId}/reservar/ok?appointmentId=${data.appointmentId}`,
      pending: `${data.baseUrl}/plataforma/${data.tenantId}/reservar/ok?appointmentId=${data.appointmentId}`,
      failure: `${data.baseUrl}/plataforma/${data.tenantId}/reservar?mp_error=payment_failed`,
    },
    auto_return: "approved",
    external_reference: data.appointmentId,
    purpose: "wallet_purchase",
    statement_descriptor: "KOBER SHIFTS",
    notification_url: `${data.baseUrl}/api/integrations/mercadopago/webhook?tenantId=${data.tenantId}&appointmentId=${data.appointmentId}`,
  };

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${account.accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error creating ML preference:", errorText);
    throw new Error(`Mercado Pago error: ${response.status}`);
  }

  const result = await response.json();
  return {
    id: result.id,
    init_point: result.init_point, // En produccion
    sandbox_init_point: result.sandbox_init_point,
  };
}
