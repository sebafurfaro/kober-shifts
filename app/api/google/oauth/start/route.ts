import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getGoogleAuthUrl } from "@/lib/googleOAuth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "Only professionals can link Google" }, { status: 403 });
  }

  const url = getGoogleAuthUrl(session.userId);
  return NextResponse.redirect(url);
}


