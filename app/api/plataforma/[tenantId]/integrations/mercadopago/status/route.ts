import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { hasMercadoPagoAccount } from "@/lib/mercadopago-accounts";
import { Role } from "@/lib/types";

/**
 * GET /api/plataforma/[tenantId]/integrations/mercadopago/status
 * Returns whether the tenant has linked MercadoPago via OAuth.
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
  if (session.role !== Role.ADMIN && session.role !== Role.PROFESSIONAL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const oauthLinked = await hasMercadoPagoAccount(tenantId);
    // Solo se considera vinculado si este tenant completó OAuth. No usar token global para la UI.
    return NextResponse.json({ linked: oauthLinked });
  } catch (error) {
    console.error("Error checking MercadoPago status:", error);
    return NextResponse.json({ linked: false });
  }
}
