import { resend } from "@/lib/resend";

export async function POST(req: Request) {
    const { to, subject, html } = await req.json();

    const { data, error } = await resend.emails.send({
        from: "Nodo App Turnos <nodoapp@no-reply.com>",
        to,
        subject, 
        html,
    });

    if (error) return Response.json({ error }, { status: 400 });
    return Response.json({ data });
}