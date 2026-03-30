import { NextResponse } from "next/server";
import { findStaffUsersWithEmail } from "@/lib/db";
import { verifyRecaptcha } from "@/lib/recaptcha";
import {
  createSessionCookieValue,
  getSessionCookieOptions,
  PWA_SESSION_COOKIE,
  PWA_SESSION_MAX_AGE_SECONDS,
  SESSION_COOKIE,
} from "@/lib/session";
import { verifyPassword } from "@/lib/auth";

/**
 * Login del equipo (ADMIN / PROFESSIONAL / SUPERVISOR) sin tenant en la URL.
 * El correo solo puede estar asociado a un comercio como staff; el tenant se deduce del usuario.
 * Los pacientes deben usar /plataforma/[tenantId]/login.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password.trim() : "";
  const pwa = body.pwa === true;
  const recaptchaToken = typeof body.recaptchaToken === "string" ? body.recaptchaToken : "";

  if (!recaptchaToken) {
    return NextResponse.json({ error: "No se pudo validar reCAPTCHA" }, { status: 400 });
  }

  const recaptchaResult = await verifyRecaptcha(recaptchaToken, "LOGIN");
  if (!recaptchaResult.success) {
    return NextResponse.json({ error: "Validación de seguridad fallida. Intenta nuevamente." }, { status: 403 });
  }

  try {
    const staffList = email ? await findStaffUsersWithEmail(email) : [];
    if (staffList.length === 0) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }
    if (staffList.length > 1) {
      return NextResponse.json(
        { error: "Hay un conflicto con esta cuenta. Contactá a soporte." },
        { status: 409 }
      );
    }

    const user = staffList[0];
    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    const tenantId = user.tenantId;
    const res = NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId,
    });
    res.cookies.set(
      SESSION_COOKIE,
      createSessionCookieValue({
        userId: user.id,
        role: user.role,
        tenantId,
      }),
      {
        ...getSessionCookieOptions({ persistent: pwa }),
      }
    );
    if (pwa) {
      res.cookies.set(PWA_SESSION_COOKIE, "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: PWA_SESSION_MAX_AGE_SECONDS,
      });
    }
    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const isDbError = /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|ER_|PROTOCOL_CONNECTION|connect/i.test(msg);
    if (isDbError) {
      return NextResponse.json(
        {
          error:
            "Error de conexión con la base de datos. Verificá que MySQL esté corriendo (ej. Docker) y que MYSQL_HOST/MYSQL_PORT en .env coincidan con el puerto expuesto (ej. 3309).",
        },
        { status: 503 }
      );
    }
    throw err;
  }
}
