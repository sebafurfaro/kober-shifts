import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { Role } from "@/lib/types";
import { ensureWebPushConfigured, webpush } from "@/lib/push/configure-web-push";
import { getPushSubscriptionForUser } from "@/lib/push/push-subscriptions-db";

/**
 * POST /api/plataforma/[tenantId]/push/test
 * Envía una notificación de prueba al usuario actual (requiere suscripción previa vía /push/subscribe).
 * Solo ADMIN (evita abuso en entornos con memoria compartida).
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
  if (session.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    ensureWebPushConfigured();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "VAPID no configurado";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const sub = await getPushSubscriptionForUser(tenantId, session.userId);
  if (!sub) {
    return NextResponse.json(
      { error: "No hay suscripción push. Activá notificaciones en la página de prueba primero." },
      { status: 400 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    body?: string;
    url?: string;
  };

  const payload = JSON.stringify({
    title: typeof body.title === "string" ? body.title : "Turnos Nodo — prueba",
    body: typeof body.body === "string" ? body.body : "Notificación de prueba (Web Push)",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    url: typeof body.url === "string" && body.url.startsWith("/") ? body.url : "/plataforma/" + tenantId + "/panel",
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "test",
    },
  });

  try {
    await webpush.sendNotification(sub, payload, {
      TTL: 60,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("webpush.sendNotification:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fallo al enviar la notificación" },
      { status: 502 }
    );
  }
}
