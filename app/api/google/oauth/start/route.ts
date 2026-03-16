import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getGoogleCalendarAuthUrl } from "@/lib/googleOAuth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "Only professionals can link Google" }, { status: 403 });
  }

  // Encode both userId and tenantId into state
  const stateObj = { userId: session.userId, tenantId: session.tenantId };
  const state = Buffer.from(JSON.stringify(stateObj)).toString("base64");

  const url = getGoogleCalendarAuthUrl(state);
  return NextResponse.redirect(url);
}


