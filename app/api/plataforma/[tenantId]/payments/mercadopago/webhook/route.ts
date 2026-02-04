import { NextResponse } from "next/server";
import { mongoClientPromise } from "@/lib/mongo";
import mysql from "@/lib/mysql";
import { MercadoPagoConfig, Payment } from "mercadopago";
import crypto from "crypto";
import { getMercadoPagoAccountByTenant } from "@/lib/mercadopago-accounts";
import { findAppointmentById, updateAppointmentStatus } from "@/lib/db";
import { AppointmentStatus } from "@/lib/types";

async function getTenantAccessToken(tenantId: string): Promise<string | null> {
  const account = await getMercadoPagoAccountByTenant(tenantId);
  if (account?.accessToken) return account.accessToken;
  const client = await mongoClientPromise;
  const db = client.db();
  const collection = db.collection("tenant_payments");
  const settings = await collection.findOne({ tenantId });
  return settings?.settings?.mercadoPago?.accessToken || null;
}

async function getWebhookSecret(_tenantId: string): Promise<string | null> {
  const fromEnv = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (fromEnv) return fromEnv;
  const client = await mongoClientPromise;
  const db = client.db();
  const collection = db.collection("tenant_payments");
  const settings = await collection.findOne({ tenantId: _tenantId });
  const fromTenant = settings?.settings?.mercadoPago?.webhookSecret;
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

    const paymentsCollection = (await mongoClientPromise)
      .db()
      .collection("payments");

    await paymentsCollection.updateOne(
      { tenantId, "mercadoPago.preferenceId": paymentData.preference_id },
      {
        $set: {
          status: paymentData.status,
          mercadoPago: {
            preferenceId: paymentData.preference_id,
            paymentId: paymentData.id,
            status: paymentData.status,
            statusDetail: paymentData.status_detail,
          },
          updatedAt: new Date(),
        },
      }
    );

    await ensurePaymentsTable();
    const appointmentId = paymentData.external_reference || null;
    if (paymentData.preference_id) {
      await mysql.execute(
        `UPDATE appointment_payments
         SET status = ?, paymentId = ?
         WHERE tenantId = ? AND preferenceId = ?`,
        [
          paymentData.status,
          paymentData.id,
          tenantId,
          paymentData.preference_id,
        ]
      );
    } else if (appointmentId) {
      await mysql.execute(
        `UPDATE appointment_payments
         SET status = ?, paymentId = ?
         WHERE tenantId = ? AND appointmentId = ?`,
        [
          paymentData.status,
          paymentData.id,
          tenantId,
          appointmentId,
        ]
      );
    }

    if (
      paymentData.status === "approved" &&
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
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing Mercado Pago webhook:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
