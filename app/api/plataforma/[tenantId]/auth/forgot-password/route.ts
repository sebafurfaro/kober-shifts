import { NextResponse } from "next/server";
import { findUserByEmail, createPasswordResetToken } from "@/lib/db";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(
    req: Request,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    try {
        const { tenantId } = await params;
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: "El correo electrónico es requerido" }, { status: 400 });
        }

        const user = await findUserByEmail(email, tenantId);

        if (user) {
            const rawToken = crypto.randomBytes(32).toString('hex');
            const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

            // Expira en 60 minutos
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

            await createPasswordResetToken(user.id, tokenHash, expiresAt);

            const url = new URL(req.url);
            const resetLink = `${url.origin}/plataforma/${tenantId}/reset-password?token=${rawToken}`;

            await resend.emails.send({
                from: "NODO <onboarding@resend.dev>", // Cambiar a dominio verificado cuando exista
                to: [user.email],
                subject: "Recuperación de contraseña",
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Restablecer contraseña</h2>
                        <p>Hola ${user.name || ''},</p>
                        <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el siguiente enlace para crear una nueva:</p>
                        <div style="margin: 30px 0;">
                            <a href="${resetLink}" style="background-color: #006FEE; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                Restablecer mi contraseña
                            </a>
                        </div>
                        <p>Este enlace expirará en 60 minutos por razones de seguridad.</p>
                        <p>Si no has solicitado este cambio, por favor ignora este correo. Tu contraseña actual seguirá siendo segura.</p>
                        <hr style="border: 1px solid #eee; margin-top: 30px;" />
                        <p style="color: #888; font-size: 12px;">El equipo de NODO Turnos</p>
                    </div>
                `
            });
        }

        // Siempre respondemos con éxito genérico por seguridad
        return NextResponse.json({ success: true, message: "Solicitud procesada." });

    } catch (error) {
        console.error("Error en forgot-password route:", error);
        return NextResponse.json(
            { error: "Ocurrió un error inesperado al procesar la solicitud." },
            { status: 500 }
        );
    }
}
