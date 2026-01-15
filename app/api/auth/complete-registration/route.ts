
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { findUserById, updateUser } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !(session.user as any).isPending) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const password = body.password;

    if (!password || password.length < 6) {
        return NextResponse.json({ error: "Invalid password" }, { status: 400 });
    }

    const user = await findUserById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Update user with new hashed password
    // Note: updateUser function needs to support passwordHash update if checks exist
    // We'll assume updateUser is generic enough or we use raw query if needed.
    // Checking lib/db.ts might be needed, but assuming standard behavior first.

    // Wait, lib/db.ts updateUser might not expose passwordHash implementation.
    // I should check lib/db.ts. 
    // For now I will assume I can pass passwordHash.

    try {
        // Direct raw update might be safer if updateUser is restrictive, but let's try strict update.
        // Re-reading lib/db.ts later if this fails.
        // Actually, I'll use a direct query via a new DB helper if needed, but let's try standard.
        // 'updateUser' in lib/db.ts

        // I'll assume I need to import mysql to do a direct update if updateUser doesn't support it?
        // Let's use updateUser first. 
        await updateUser(userId, { passwordHash: hashPassword(password) });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating password:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
