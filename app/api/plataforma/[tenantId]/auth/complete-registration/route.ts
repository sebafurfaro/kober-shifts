import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findUserById, updateUser } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
    const session = await getSession();

    if (!session || session.tenantId !== tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const password = typeof body.password === "string" ? body.password : "";

    if (!password || password.length < 6) {
        return NextResponse.json({ error: "Invalid password" }, { status: 400 });
    }

    const user = await findUserById(userId, tenantId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    try {
        await updateUser(userId, tenantId, { passwordHash: hashPassword(password) });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating password:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
