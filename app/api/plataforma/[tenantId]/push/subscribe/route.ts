import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import type { PushSubscription } from "web-push";
import { upsertPushSubscription } from "@/lib/push/push-subscriptions-db";

/**
 * POST /api/plataforma/[tenantId]/push/subscribe
 * Body: suscripción JSON de PushManager (endpoint + keys).
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

  const body = (await req.json().catch(() => null)) as { subscription?: PushSubscription } | null;
  const subscription = body?.subscription;
  if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await upsertPushSubscription(tenantId, session.userId, subscription);
  return NextResponse.json({ success: true });
}
