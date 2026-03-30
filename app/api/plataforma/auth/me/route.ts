import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findUserById } from "@/lib/db";

/**
 * Sesión actual sin tenant en la path (útil para la entrada PWA bajo /plataforma).
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await findUserById(session.userId, session.tenantId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: session.tenantId,
    });
  } catch (error: unknown) {
    console.error("GET /api/plataforma/auth/me:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
