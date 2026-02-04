import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  getMercadoPagoAccountByTenant,
  deactivateMercadoPagoAccount,
} from "@/lib/mercadopago-accounts";
import { Role } from "@/lib/types";

const MP_POS_LIST_URL = "https://api.mercadopago.com/pos";

/**
 * POST /api/plataforma/[tenantId]/integrations/mercadopago/disconnect
 * Desvincula la cuenta de Mercado Pago: elimina el punto de venta (DELETE /pos/{id}) y desactiva la cuenta en nuestra DB.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== Role.ADMIN && session.role !== Role.PROFESSIONAL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const account = await getMercadoPagoAccountByTenant(tenantId);
  if (!account?.accessToken) {
    return NextResponse.json(
      { error: "No hay cuenta de Mercado Pago vinculada" },
      { status: 400 }
    );
  }

  const authHeader = `Bearer ${account.accessToken}`;

  try {
    const listRes = await fetch(MP_POS_LIST_URL, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (listRes.ok) {
      const listData = (await listRes.json()) as {
        results?: Array<{ id: number | string }>;
      };
      const results = listData.results ?? [];
      for (const pos of results) {
        const posId = String(pos.id);
        await fetch(`${MP_POS_LIST_URL}/${posId}`, {
          method: "DELETE",
          headers: { Authorization: authHeader },
        });
      }
    }
  } catch (err) {
    console.error("Error calling Mercado Pago POS API:", err);
    // Sigue con la desvinculación en nuestra DB aunque falle MP
  }

  await deactivateMercadoPagoAccount(tenantId);

  return NextResponse.json({ ok: true });
}
