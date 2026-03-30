import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getMercadoPagoAccountByTenant } from "@/lib/mercadopago-accounts";
import { Role } from "@/lib/types";

const MP_POS_LIST_URL = "https://api.mercadopago.com/pos";

export type MercadoPagoPOS = {
  id: number | string;
  name?: string;
  external_id?: string;
  external_store_id?: string;
  store_id?: number;
  category?: number;
  date_created?: string;
  date_last_updated?: string;
  qr?: {
    image?: string;
    template_document?: string;
    template_image?: string;
  };
};

/**
 * GET /api/plataforma/[tenantId]/integrations/mercadopago/pos
 * Devuelve los puntos de venta asociados a la cuenta de Mercado Pago vinculada al tenant.
 */
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

  const account = await getMercadoPagoAccountByTenant(tenantId);
  if (!account?.accessToken) {
    return NextResponse.json(
      { pos: [], linked: false, error: "No hay cuenta de Mercado Pago vinculada" },
      { status: 200 }
    );
  }

  try {
    const res = await fetch(MP_POS_LIST_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Mercado Pago POS list error:", res.status, errText);
      return NextResponse.json(
        { pos: [], linked: true, error: "Error al obtener puntos de venta" },
        { status: 200 }
      );
    }

    const data = (await res.json()) as { results?: MercadoPagoPOS[] };
    const pos = Array.isArray(data.results) ? data.results : [];

    return NextResponse.json({ pos, linked: true });
  } catch (err) {
    console.error("Error fetching Mercado Pago POS:", err);
    return NextResponse.json(
      { pos: [], linked: true, error: "Error al obtener puntos de venta" },
      { status: 200 }
    );
  }
}
