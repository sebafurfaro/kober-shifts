import { NextResponse } from "next/server";
import { findResetTokenByHash, markTokenAsUsed, updateUser, findUserById } from "@/lib/db";
import { hashPassword, validatePassword } from "@/lib/auth";
import crypto from "crypto";
import { Resend } from "resend";
import { cookies } from "next/headers";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(
    req: Request,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    try {
        const { tenantId } = await params;
        const body = await req.json();
        const { token, password } = body;

        if (!token || !password) {
            return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
        }

        // Validación de fuerza de contraseña usando utilidades existentes
        const validation = validatePassword(password);
        if (!validation.isValid) {
            return NextResponse.json({ error: validation.errors[0] }, { status: 400 });
        }

        // Validar el token
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const resetRecord = await findResetTokenByHash(tokenHash);

        if (!resetRecord) {
            return NextResponse.json({ error: "El enlace es inválido o ha expirado" }, { status: 400 });
        }

        if (resetRecord.used === 1) {
            return NextResponse.json({ error: "Este enlace ya fue utilizado" }, { status: 400 });
        }

        if (new Date(resetRecord.expires_at) < new Date()) {
            return NextResponse.json({ error: "El enlace ha expirado" }, { status: 400 });
        }

        const user = await findUserById(resetRecord.user_id, tenantId);
        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // Actualizar contraseña guardando el nuevo hash compatible con scrypt
        const newPasswordHash = hashPassword(password);
        await updateUser(user.id, tenantId, { passwordHash: newPasswordHash });

        // Marcar token como utilizado
        await markTokenAsUsed(resetRecord.id);

        // Al finalizar, borramos la sesión actual del navegador por seguridad
        // (Nota: Las sesiones globales no son revocables stateless en DB a menos que implementemos una blacklist, 
        // pero esto limpia la cookie local activa).
        const cookieStore = await cookies();
        cookieStore.delete('session');

        // Enviar email de confirmación
        try {
            await resend.emails.send({
                from: "NODO <onboarding@resend.dev>", // TODO: Cambiar a dominio verificado
                to: [user.email],
                subject: "Tu contraseña ha sido actualizada",
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Contraseña actualizada correctamente</h2>
                        <p>Hola ${user.name || ''},</p>
                        <p>Te confirmamos que la contraseña de tu cuenta en NODO Turnos ha sido modificada con éxito.</p>
                        <p>Si no realizaste este cambio, por favor contacta urgente con soporte.</p>
                        <hr style="border: 1px solid #eee; margin-top: 30px;" />
                        <p style="color: #888; font-size: 12px;">El equipo de NODO Turnos</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error("Error enviando email de confirmación:", emailError);
            // Non-blocking error
        }

        return NextResponse.json({ success: true, message: "Contraseña actualizada con éxito" });

    } catch (error) {
        console.error("Error en reset-password route:", error);
        return NextResponse.json(
            { error: "Ocurrió un error inesperado al restablecer la contraseña." },
            { status: 500 }
        );
    }
}
