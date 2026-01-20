import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/googleOAuth";
import { findUserByEmail, findUserByGoogleId, linkGoogleAccount, createUser } from "@/lib/db";
import { createSessionCookieValue, getSessionCookieOptions, SESSION_COOKIE } from "@/lib/session";
import { Role } from "@/lib/types";
import crypto from "crypto";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    let tenantId = "default";
    let callbackUrl = "/";

    if (state) {
        try {
            const decodedState = JSON.parse(Buffer.from(state, "base64").toString());
            tenantId = decodedState.tenantId || "default";
            callbackUrl = decodedState.callbackUrl || `/plataforma/${tenantId}/panel`;
        } catch (e) {
            console.error("Failed to decode state:", e);
        }
    }

    if (!code) {
        return NextResponse.redirect(new URL(`/plataforma/${tenantId}/login?error=no_code`, req.url));
    }

    try {
        const tokens = await exchangeCodeForTokens(code);

        // Get user info from id_token
        const idToken = tokens.id_token;
        if (!idToken) throw new Error("No id_token received");

        // Simple way to decode JWT payload without library for now (just for email/sub)
        const payload = JSON.parse(Buffer.from(idToken.split(".")[1], "base64").toString());
        const email = payload.email;
        const googleId = payload.sub;
        const name = payload.name;

        if (!email || !googleId) {
            throw new Error("Invalid user info from Google");
        }

        // 1. Try to find user by googleId
        let user = await findUserByGoogleId(googleId, tenantId);

        // 2. If not found, try to find by email
        if (!user) {
            user = await findUserByEmail(email, tenantId);
            if (user) {
                // Link account
                await linkGoogleAccount(user.id, tenantId, googleId);
            }
        }

        // 3. If still not found, create new user (as PATIENT by default)
        if (!user) {
            user = await createUser({
                id: crypto.randomUUID(),
                tenantId: tenantId,
                email: email,
                name: name || email,
                googleId: googleId,
                passwordHash: "", // No password for Google users initially
                role: Role.PATIENT,
            });
        }

        // Create session
        const res = NextResponse.redirect(new URL(callbackUrl, req.url));
        res.cookies.set(SESSION_COOKIE, createSessionCookieValue({
            userId: user.id,
            role: user.role,
            tenantId: tenantId
        }), {
            ...getSessionCookieOptions(),
        });

        return res;
    } catch (error: any) {
        console.error("Google Auth Error:", error);
        return NextResponse.redirect(new URL(`/plataforma/${tenantId}/login?error=${encodeURIComponent(error.message)}`, req.url));
    }
}
