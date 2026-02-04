import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { mongoClientPromise } from "@/lib/mongo";
import mysql from "@/lib/mysql";
import { Role } from "@/lib/types";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { randomUUID } from "crypto";
import { getMercadoPagoAccountByTenant } from "@/lib/mercadopago-accounts";
import { findAppointmentById, updateAppointmentStatus } from "@/lib/db";
import { AppointmentStatus } from "@/lib/types";

type PaymentPurpose = "full" | "deposit";

function getBaseUrl(req: Request) {
  const origin = req.headers.get("origin");
  if (origin) return origin;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "http";
  return host ? `${proto}://${host}` : "";
}

async function getTenantPaymentsSettings(tenantId: string) {
  const client = await mongoClientPromise;
  const db = client.db();
  const collection = db.collection("tenant_payments");
  const settings = await collection.findOne({ tenantId });
  return settings?.settings || null;
}

async function getAccessTokenForTenant(tenantId: string): Promise<string | null> {
  const account = await getMercadoPagoAccountByTenant(tenantId);
  if (account?.accessToken) return account.accessToken;
  const settings = await getTenantPaymentsSettings(tenantId);
  if (settings?.mercadoPago?.accessToken) return settings.mercadoPago.accessToken;
  const fromEnv = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  return fromEnv || null;
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const isPatient = session.role === Role.PATIENT;
  const isAdminOrProfessional = session.role === Role.ADMIN || session.role === Role.PROFESSIONAL;
  if (!isPatient && !isAdminOrProfessional) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);
    const appointmentId = typeof body.appointmentId === "string" ? body.appointmentId : null;
    const purpose = (body.purpose as PaymentPurpose) || "full";
    const description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : purpose === "deposit"
          ? "Seña de turno"
          : "Pago de turno";

    if (!appointmentId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const accessToken = await getAccessTokenForTenant(tenantId);
    if (!accessToken) {
      return NextResponse.json({ error: "Mercado Pago no configurado. Vinculá tu cuenta en Pagos." }, { status: 400 });
    }

    const appointment = await findAppointmentById(appointmentId, tenantId);
    if (!appointment) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }
    if (isPatient && appointment.patientId !== session.userId) {
      return NextResponse.json({ error: "No podés crear el pago de este turno" }, { status: 403 });
    }

    const baseUrl = getBaseUrl(req);
    const notificationUrl = baseUrl
      ? `${baseUrl}/api/plataforma/${tenantId}/payments/mercadopago/webhook`
      : undefined;

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const preferenceResult = await preference.create({
      body: {
        items: [
          {
            title: description,
            quantity: 1,
            unit_price: Number(amount),
            currency_id: "ARS",
          },
        ],
        external_reference: appointmentId,
        back_urls: baseUrl
          ? {
              success: `${baseUrl}/plataforma/${tenantId}/panel`,
              pending: `${baseUrl}/plataforma/${tenantId}/panel`,
              failure: `${baseUrl}/plataforma/${tenantId}/panel`,
            }
          : undefined,
        notification_url: notificationUrl,
      },
    });

    const paymentsCollection = (await mongoClientPromise)
      .db()
      .collection("payments");

    await paymentsCollection.insertOne({
      tenantId,
      appointmentId,
      purpose,
      amount: Number(amount),
      status: "PENDING",
      provider: "mercadopago",
      mercadoPago: {
        preferenceId: preferenceResult.id,
        initPoint: preferenceResult.init_point,
        sandboxInitPoint: preferenceResult.sandbox_init_point,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await ensurePaymentsTable();
    await mysql.execute(
      `INSERT INTO appointment_payments
        (id, tenantId, appointmentId, provider, purpose, amount, status, preferenceId, paymentId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        tenantId,
        appointmentId,
        "mercadopago",
        purpose,
        Number(amount),
        "PENDING",
        preferenceResult.id,
        null,
      ]
    );

    if (purpose === "deposit" && appointment.status === AppointmentStatus.REQUESTED) {
      try {
        await updateAppointmentStatus(appointmentId, tenantId, AppointmentStatus.PENDING_DEPOSIT);
      } catch (err) {
        console.warn("Could not set appointment to PENDING_DEPOSIT (run migration_mercadopago_oauth.sql if needed):", err);
      }
    }

    return NextResponse.json({
      preferenceId: preferenceResult.id,
      initPoint: preferenceResult.init_point,
      sandboxInitPoint: preferenceResult.sandbox_init_point,
    });
  } catch (error: any) {
    console.error("Error creating Mercado Pago preference:", error);
    return NextResponse.json(
      { error: "Failed to create preference" },
      { status: 500 }
    );
  }
}
