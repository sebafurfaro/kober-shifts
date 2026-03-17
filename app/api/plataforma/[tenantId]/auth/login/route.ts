import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/db";
import { createSessionCookieValue, getSessionCookieOptions, SESSION_COOKIE } from "@/lib/session";
import { verifyPassword } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password.trim() : "";

  try {
    const user = email ? await findUserByEmail(email, tenantId) : null;
    if (!user) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    const res = NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role });
    res.cookies.set(SESSION_COOKIE, createSessionCookieValue({
      userId: user.id,
      role: user.role,
      tenantId: tenantId
    }), {
      ...getSessionCookieOptions(),
    });
    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const isDbError = /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|ER_|PROTOCOL_CONNECTION|connect/i.test(msg);
    if (isDbError) {
      return NextResponse.json(
        { error: "Error de conexión con la base de datos. Verificá que MySQL esté corriendo (ej. Docker) y que MYSQL_HOST/MYSQL_PORT en .env coincidan con el puerto expuesto (ej. 3309)." },
        { status: 503 }
      );
    }
    throw err;
  }
}


