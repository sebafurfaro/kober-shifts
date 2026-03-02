
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { findUserByEmail, createUser, findUserById } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/auth";
import { Role } from "@/lib/types";
import { randomUUID } from "crypto";

export const getAuthOptions = (tenantId: string): NextAuthOptions => ({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await findUserByEmail(credentials.email, tenantId);
                if (!user) return null;

                // If user is pending registration (placeholder password), deny credential login
                if (user.passwordHash.startsWith("PENDING_GOOGLE_")) return null;

                const isValid = await verifyPassword(credentials.password, user.passwordHash);
                if (!isValid) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                const email = user.email;
                if (!email) return false;

                const existingUser = await findUserByEmail(email, tenantId);

                if (existingUser) {
                    // Check if valid user (not pending) or if we allow merging
                    // Ideally we should auto-merge or allow login.
                    // If pending, they need to complete registration (which happens after login anyway)
                    user.id = existingUser.id;
                    // We need to pass the role to the JWT
                    (user as any).role = existingUser.role;
                    (user as any).isPending = existingUser.passwordHash.startsWith("PENDING_GOOGLE_");
                    return true;
                }

                // New user: Create account automatically as PATIENT.
                const name = user.name || "Usuario Google";
                const passwordHash = `PENDING_GOOGLE_${randomUUID()}`; // Placeholder
                const role = Role.PATIENT;

                const newUser = await createUser({
                    id: randomUUID(),
                    email,
                    name,
                    role,
                    passwordHash,
                    tenantId,
                });

                user.id = newUser.id;
                (user as any).role = newUser.role;
                (user as any).isPending = true;
                return true;
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.isPending = (user as any).isPending;
                token.tenantId = tenantId; // attach tenantId to JWT
            } else if (token.tenantId && token.tenantId !== tenantId) {
                // If user already has a session with a different tenant, invalidate it
                // This prevents cross-tenant access
                return null as any;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).isPending = token.isPending;
                (session.user as any).tenantId = token.tenantId;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
    },
});

export async function GET(request: Request) {
    const tenantId = request.headers.get('x-tenant-id') ?? '';
    const handler = NextAuth(getAuthOptions(tenantId));
    return handler(request);
}

export async function POST(request: Request) {
    const tenantId = request.headers.get('x-tenant-id') ?? '';
    const handler = NextAuth(getAuthOptions(tenantId));
    return handler(request);
}
