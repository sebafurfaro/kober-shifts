import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getTenantPaymentsRow, upsertTenantPayments } from "@/lib/settings-db";
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
  if (
    session.role !== Role.ADMIN &&
    session.role !== Role.PROFESSIONAL &&
    session.role !== Role.SUPERVISOR
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const row = await getTenantPaymentsRow(tenantId);
    const existing = row;

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

    return NextResponse.json(row?.settings || defaultSettings);
  } catch (error: unknown) {
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
  if (
    session.role !== Role.ADMIN &&
    session.role !== Role.PROFESSIONAL &&
    session.role !== Role.SUPERVISOR
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const row = await getTenantPaymentsRow(tenantId);
    const existingDoc = row;

    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const bank = body.bank && typeof body.bank === "object" ? body.bank : null;
    const mercadoPago = body.mercadoPago && typeof body.mercadoPago === "object"
      ? body.mercadoPago
      : null;
    const paymentConfig = body.paymentConfig && typeof body.paymentConfig === "object"
      ? body.paymentConfig
      : null;

    const existingSettings = (existingDoc?.settings ?? {}) as Record<string, unknown>;
    const existingBank = (existingSettings.bank && typeof existingSettings.bank === "object" ? existingSettings.bank : {}) as Record<string, string>;
    const existingMercadoPago = (existingSettings.mercadoPago && typeof existingSettings.mercadoPago === "object" ? existingSettings.mercadoPago : {}) as Record<string, string>;
    const existingPaymentConfig = (existingSettings.paymentConfig && typeof existingSettings.paymentConfig === "object" ? existingSettings.paymentConfig : {}) as Record<string, unknown>;

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

    await upsertTenantPayments(tenantId, settings);

    return NextResponse.json({ success: true, settings });
  } catch (error: unknown) {
    console.error("Error updating payments settings:", error);
    return NextResponse.json(
      { error: "Failed to update payments settings" },
      { status: 500 }
    );
  }
}
