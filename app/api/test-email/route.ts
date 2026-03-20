import { NextResponse } from "next/server";
import { sendMail, renderBasicTemplate } from "@/lib/email";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const to = searchParams.get("to");

  if (!to) {
    return NextResponse.json({ error: "Falta el parámetro ?to=email@ejemplo.com" }, { status: 400 });
  }

  try {
    await sendMail({
      to,
      subject: "Test de integración — Resend",
      text: "Si recibís este mensaje, la integración con Resend está funcionando correctamente.",
      html: renderBasicTemplate({
        title: "Test de integración",
        preview: "La integración con Resend funciona correctamente.",
        body: "<p>Si recibís este mensaje, la integración con <strong>Resend</strong> está funcionando correctamente.</p>",
        footer: "NODO App — test de integración",
      }),
    });
    return NextResponse.json({ success: true, sentTo: to });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
