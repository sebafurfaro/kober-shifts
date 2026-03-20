import { NextResponse } from "next/server";
import { getTenantPaymentsRow, getTenantSettingsRow } from "@/lib/settings-db";
import mysql from "@/lib/mysql";
import { MercadoPagoConfig, Payment } from "mercadopago";
import crypto from "crypto";
import { getMercadoPagoAccountByTenant, getMercadoPagoAccountWithRefresh } from "@/lib/mercadopago-accounts";
import { findAppointmentById, updateAppointmentStatus, findAppointmentWithRelations } from "@/lib/db";
import { AppointmentStatus } from "@/lib/types";
import { renderBasicTemplate, sendMail, getTurnoConfirmadoPacienteContent, getTurnoConfirmadoProfesionalContent, formatLocationAddress } from "@/lib/email";
import { mysqlDateToUTC, formatInBuenosAires } from "@/lib/timezone";

async function getTenantAccessToken(tenantId: string): Promise<string | null> {
  const accountFetcher =
    typeof getMercadoPagoAccountWithRefresh === "function"
      ? getMercadoPagoAccountWithRefresh
      : getMercadoPagoAccountByTenant;
  const account = await accountFetcher(tenantId);
  if (account?.accessToken) return account.accessToken;
  const row = await getTenantPaymentsRow(tenantId);
  const mp = row?.settings && typeof row.settings === "object" ? (row.settings as { mercadoPago?: { accessToken?: string } }).mercadoPago : undefined;
  return (mp?.accessToken && typeof mp.accessToken === "string" ? mp.accessToken.trim() : null) || null;
}

async function getWebhookSecret(_tenantId: string): Promise<string | null> {
  const fromEnv = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (fromEnv) return fromEnv;
  const row = await getTenantPaymentsRow(_tenantId);
  const mp = row?.settings && typeof row.settings === "object" ? (row.settings as { mercadoPago?: { webhookSecret?: string } }).mercadoPago : undefined;
  const fromTenant = mp?.webhookSecret;
  if (fromTenant && typeof fromTenant === "string" && fromTenant.trim()) return fromTenant.trim();
  return null;
}

async function ensurePaymentsTable() {
  await mysql.execute(`
    CREATE TABLE IF NOT EXISTS appointment_payments (
      id VARCHAR(36) PRIMARY KEY,
      tenantId VARCHAR(255) NOT NULL,
      appointmentId VARCHAR(255) NOT NULL,
      provider VARCHAR(50) NOT NULL,
      purpose VARCHAR(20) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      status VARCHAR(30) NOT NULL,
      preferenceId VARCHAR(255),
      paymentId VARCHAR(255),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_appt_payments_tenant (tenantId),
      INDEX idx_appt_payments_appointment (appointmentId),
      INDEX idx_appt_payments_preference (preferenceId)
    )
  `);
}

function parseSignature(signatureHeader: string | null) {
  if (!signatureHeader) return null;
  const parts = signatureHeader.split(",");
  let ts: string | null = null;
  let v1: string | null = null;
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (!key || !value) continue;
    const trimmedKey = key.trim();
    const trimmedValue = value.trim();
    if (trimmedKey === "ts") ts = trimmedValue;
    if (trimmedKey === "v1") v1 = trimmedValue;
  }
  if (!ts || !v1) return null;
  return { ts, v1 };
}

function validateSignature({
  signatureHeader,
  requestId,
  dataId,
  webhookSecret,
}: {
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | null;
  webhookSecret: string;
}) {
  const parsed = parseSignature(signatureHeader);
  if (!parsed || !requestId || !dataId) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${parsed.ts};`;
  const hmac = crypto.createHmac("sha256", webhookSecret);
  const digest = hmac.update(manifest).digest("hex");
  return digest === parsed.v1;
}

function normalizeAmount(value: unknown): number | null {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100) / 100;
}

async function findPaymentRow({
  tenantId,
  paymentId,
  preferenceId,
  appointmentId,
}: {
  tenantId: string;
  paymentId: string | null;
  preferenceId: string | null;
  appointmentId: string | null;
}) {
  if (paymentId) {
    const [rows] = await mysql.execute(
      `SELECT id, appointmentId, amount, status, paymentId FROM appointment_payments
       WHERE tenantId = ? AND paymentId = ? LIMIT 1`,
      [tenantId, paymentId]
    );
    const result = rows as any[];
    if (result.length > 0) return result[0];
  }
  if (preferenceId) {
    const [rows] = await mysql.execute(
      `SELECT id, appointmentId, amount, status, paymentId FROM appointment_payments
       WHERE tenantId = ? AND preferenceId = ? LIMIT 1`,
      [tenantId, preferenceId]
    );
    const result = rows as any[];
    if (result.length > 0) return result[0];
  }
  if (appointmentId) {
    const [rows] = await mysql.execute(
      `SELECT id, appointmentId, amount, status, paymentId FROM appointment_payments
       WHERE tenantId = ? AND appointmentId = ? LIMIT 1`,
      [tenantId, appointmentId]
    );
    const result = rows as any[];
    if (result.length > 0) return result[0];
  }
  return null;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;

  try {
    const url = new URL(req.url);
    const body = (await req.json().catch(() => ({}))) as any;
    const type = body.type || url.searchParams.get("type");
    const dataId = url.searchParams.get("data.id") || body.data?.id;

    if (type !== "payment" || !dataId) {
      return NextResponse.json({ received: true });
    }

    const accessToken = await getTenantAccessToken(tenantId);
    if (!accessToken) {
      return NextResponse.json({ error: "Mercado Pago not configured" }, { status: 400 });
    }

    const webhookSecret = await getWebhookSecret(tenantId);
    if (!webhookSecret) {
      return NextResponse.json({ error: "Webhook secret not configured (MERCADOPAGO_WEBHOOK_SECRET)" }, { status: 400 });
    }

    const signatureHeader = req.headers.get("x-signature");
    const requestId = req.headers.get("x-request-id");
    const isValid = validateSignature({
      signatureHeader,
      requestId,
      dataId,
      webhookSecret,
    });
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const mpClient = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(mpClient);
    const paymentData = await payment.get({ id: String(dataId) });
    console.log("Mercado Pago paymentData:", paymentData);
    const paymentDataAny = paymentData as {
      id?: unknown;
      preference_id?: unknown;
      external_reference?: unknown;
      status?: unknown;
      status_detail?: unknown;
      transaction_amount?: unknown;
    };
    const paymentId = paymentDataAny.id ? String(paymentDataAny.id) : null;
    const preferenceId = paymentDataAny.preference_id ? String(paymentDataAny.preference_id) : null;
    const externalReference = paymentDataAny.external_reference ? String(paymentDataAny.external_reference) : null;

    await ensurePaymentsTable();
    const paymentRow = await findPaymentRow({
      tenantId,
      paymentId,
      preferenceId,
      appointmentId: externalReference,
    });

    if (paymentRow?.paymentId && paymentId && paymentRow.paymentId === paymentId) {
      if (paymentRow.status === paymentDataAny.status || paymentRow.status === "approved") {
        return NextResponse.json({ received: true });
      }
    }

    const expectedAmount = normalizeAmount(paymentRow?.amount);
    const receivedAmount = normalizeAmount(paymentDataAny.transaction_amount);
    if (expectedAmount !== null && receivedAmount !== null && expectedAmount !== receivedAmount) {
      console.warn(
        "Webhook payment amount mismatch",
        { tenantId, paymentId, expectedAmount, receivedAmount }
      );
      return NextResponse.json({ received: true });
    }

    const appointmentId = externalReference || paymentRow?.appointmentId || null;
    if (appointmentId) {
      const appointment = await findAppointmentById(appointmentId, tenantId);
      if (!appointment) {
        console.warn("Webhook appointment not found for tenant", { tenantId, appointmentId });
        return NextResponse.json({ received: true });
      }
    }

    if (preferenceId) {
      await mysql.execute(
        `UPDATE appointment_payments
         SET status = ?, paymentId = ?
         WHERE tenantId = ? AND preferenceId = ?`,
        [
          paymentDataAny.status,
          paymentDataAny.id,
          tenantId,
          preferenceId,
        ]
      );
    } else if (appointmentId) {
      await mysql.execute(
        `UPDATE appointment_payments
         SET status = ?, paymentId = ?
         WHERE tenantId = ? AND appointmentId = ?`,
        [
          paymentDataAny.status,
          paymentDataAny.id,
          tenantId,
          appointmentId,
        ]
      );
    }

    if (
      paymentDataAny.status === "approved" &&
      appointmentId &&
      typeof appointmentId === "string"
    ) {
      const appointment = await findAppointmentById(appointmentId, tenantId);
      if (
        appointment &&
        (appointment.status === AppointmentStatus.PENDING_DEPOSIT ||
          appointment.status === AppointmentStatus.REQUESTED)
      ) {
        await updateAppointmentStatus(appointmentId, tenantId, AppointmentStatus.CONFIRMED);
        try {
          const [settingsRow, data] = await Promise.all([
            getTenantSettingsRow(tenantId),
            findAppointmentWithRelations(appointmentId, tenantId),
          ]);
          const settings = settingsRow?.settings && typeof settingsRow.settings === "object"
            ? settingsRow.settings as Record<string, unknown>
            : {};
          const sendEmailConfirmation = settings.sendEmailConfirmation === true;

          if (data && sendEmailConfirmation) {
            const startAt = data.appointment.startAt instanceof Date
              ? data.appointment.startAt
              : new Date(data.appointment.startAt);
            const startFormatted = formatInBuenosAires(mysqlDateToUTC(startAt), "dd/MM/yyyy HH:mm");
            const profesionalName = data.professional?.name ?? "el profesional";
            const pacienteContent = getTurnoConfirmadoPacienteContent({
              profesional: profesionalName,
              fechaHora: startFormatted,
              sede: data.location.name,
              sedeAddress: formatLocationAddress(data.location),
            });
            const profContent = getTurnoConfirmadoProfesionalContent({
              pacienteNombre: data.patient.name,
              pacienteEmail: data.patient.email,
              sede: data.location.name,
              sedeAddress: formatLocationAddress(data.location),
              fechaHora: startFormatted,
            });
            await sendMail({
              to: data.patient.email,
              subject: "Turno confirmado",
              text: pacienteContent.text,
              html: renderBasicTemplate({
                title: "Turno confirmado",
                preview: pacienteContent.preview,
                body: pacienteContent.bodyHtml,
              }),
            });
            await sendMail({
              to: data.professional.email,
              subject: "Turno confirmado",
              text: profContent.text,
              html: renderBasicTemplate({
                title: "Turno confirmado",
                preview: profContent.preview,
                body: profContent.bodyHtml,
              }),
            });
          }
        } catch (error) {
          console.error("Error sending confirmation email:", error);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing Mercado Pago webhook:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
