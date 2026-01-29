import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { mongoClientPromise } from "@/lib/mongo";
import { Role } from "@/lib/types";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const client = await mongoClientPromise;
    const db = client.db();
    const collection = db.collection("tenant_payments");
    const existing = await collection.findOne({ tenantId });

    const defaultSettings = {
      bank: {
        bankName: "",
        accountHolder: "",
        accountNumber: "",
        cbu: "",
        alias: "",
      },
      mercadoPago: {
        publicKey: "",
        accessToken: "",
        webhookSecret: "",
      },
      paymentConfig: {
        mode: "none",
        depositAmount: null,
        fullAmount: null,
      },
    };

    return NextResponse.json(settings?.settings || defaultSettings);
  } catch (error: any) {
    console.error("Error fetching payments settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments settings" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const bank = body.bank && typeof body.bank === "object" ? body.bank : null;
    const mercadoPago = body.mercadoPago && typeof body.mercadoPago === "object"
      ? body.mercadoPago
      : null;
    const paymentConfig = body.paymentConfig && typeof body.paymentConfig === "object"
      ? body.paymentConfig
      : null;

    const existingSettings = existing?.settings || {};
    const existingBank = existingSettings.bank || {};
    const existingMercadoPago = existingSettings.mercadoPago || {};
    const existingPaymentConfig = existingSettings.paymentConfig || {};

    const settings = {
      bank: {
        bankName: typeof bank?.bankName === "string"
          ? bank.bankName.trim()
          : existingBank.bankName || "",
        accountHolder: typeof bank?.accountHolder === "string"
          ? bank.accountHolder.trim()
          : existingBank.accountHolder || "",
        accountNumber: typeof bank?.accountNumber === "string"
          ? bank.accountNumber.trim()
          : existingBank.accountNumber || "",
        cbu: typeof bank?.cbu === "string"
          ? bank.cbu.trim()
          : existingBank.cbu || "",
        alias: typeof bank?.alias === "string"
          ? bank.alias.trim()
          : existingBank.alias || "",
      },
      mercadoPago: {
        publicKey: typeof mercadoPago?.publicKey === "string"
          ? mercadoPago.publicKey.trim()
          : existingMercadoPago.publicKey || "",
        accessToken: typeof mercadoPago?.accessToken === "string"
          ? mercadoPago.accessToken.trim()
          : existingMercadoPago.accessToken || "",
        webhookSecret: typeof mercadoPago?.webhookSecret === "string"
          ? mercadoPago.webhookSecret.trim()
          : existingMercadoPago.webhookSecret || "",
      },
      paymentConfig: {
        mode: paymentConfig?.mode === "deposit" || paymentConfig?.mode === "full"
          ? paymentConfig.mode
          : existingPaymentConfig.mode || "none",
        depositAmount: typeof paymentConfig?.depositAmount === "number"
          ? paymentConfig.depositAmount
          : typeof paymentConfig?.depositAmount === "string"
            ? Number(paymentConfig.depositAmount) || null
            : existingPaymentConfig.depositAmount ?? null,
        fullAmount: typeof paymentConfig?.fullAmount === "number"
          ? paymentConfig.fullAmount
          : typeof paymentConfig?.fullAmount === "string"
            ? Number(paymentConfig.fullAmount) || null
            : existingPaymentConfig.fullAmount ?? null,
      },
    };

    const client = await mongoClientPromise;
    const db = client.db();
    const collection = db.collection("tenant_payments");
    await collection.updateOne(
      { tenantId },
      { $set: { tenantId, settings, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("Error updating payments settings:", error);
    return NextResponse.json(
      { error: "Failed to update payments settings" },
      { status: 500 }
    );
  }
}
