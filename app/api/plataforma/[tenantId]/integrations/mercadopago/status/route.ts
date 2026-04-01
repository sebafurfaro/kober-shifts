import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  getMercadoPagoLinkageDiagnostics,
  hasMercadoPagoAccount,
} from "@/lib/mercadopago-accounts";
import { Role } from "@/lib/types";

const linkageLogEnabled = () =>
  process.env.MERCADOPAGO_LINKAGE_LOG?.trim() === "1" ||
  process.env.MERCADOPAGO_LINKAGE_LOG?.trim()?.toLowerCase() === "true";

/**
 * GET /api/plataforma/[tenantId]/integrations/mercadopago/status
 * Returns whether the tenant has linked MercadoPago via OAuth.
 *
 * Logs (servidor, Vercel/host): si `MERCADOPAGO_LINKAGE_LOG=1`, una línea JSON por request
 * con tenantId, linked y diagnóstico de fila (sin tokens).
 * Respuesta JSON incluye `_debug` solo con esa misma variable de entorno.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) {
    if (linkageLogEnabled()) {
      console.warn(
        "[mp-oauth-status]",
        JSON.stringify({
          tenantId,
          linked: null,
          auth: "fail",
          reason: !session ? "no_session" : "tenant_mismatch",
        })
      );
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (
    session.role !== Role.ADMIN &&
    session.role !== Role.PROFESSIONAL &&
    session.role !== Role.SUPERVISOR
  ) {
    if (linkageLogEnabled()) {
      console.warn(
        "[mp-oauth-status]",
        JSON.stringify({
          tenantId,
          linked: null,
          auth: "forbidden",
          role: session.role,
        })
      );
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const withLog = linkageLogEnabled();
    const diagnostics = withLog
      ? await getMercadoPagoLinkageDiagnostics(tenantId)
      : null;
    const oauthLinked = withLog
      ? diagnostics!.linked
      : await hasMercadoPagoAccount(tenantId);

    if (withLog) {
      console.info(
        "[mp-oauth-status]",
        JSON.stringify({
          tenantId,
          linked: oauthLinked,
          rowStatus: diagnostics?.rowStatus ?? null,
          role: session.role,
        })
      );
    }

    const body: {
      linked: boolean;
      paymentsLocal: boolean;
      _debug?: { rowStatus: string };
    } = { linked: oauthLinked, paymentsLocal: process.env.PAYMENTS_LOCAL === "true" };

    if (withLog && diagnostics) {
      body._debug = { rowStatus: diagnostics.rowStatus };
    }

    return NextResponse.json(body);
  } catch (error) {
    console.error("Error checking MercadoPago status:", error);
    if (linkageLogEnabled()) {
      console.error(
        "[mp-oauth-status]",
        JSON.stringify({ tenantId, linked: false, error: "exception" })
      );
    }
    return NextResponse.json({ linked: false });
  }
}
