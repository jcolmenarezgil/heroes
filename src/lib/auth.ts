import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, account, session } from "@/lib/db/schema";

const adminEmails = new Set(
    (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
);

// Optional sign-up allowlist. Unset = open registration for any Google
// account; when set, only these emails (plus ADMIN_EMAILS) may sign in.
const allowedEmails = new Set(
    (process.env.ALLOWED_EMAILS || "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
);

export const authOptions: NextAuthOptions = {
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: account,
        sessionsTable: session,
    }),
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        maxAge: 7 * 24 * 60 * 60, // 7 days
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    fullName: profile.name,
                    email: profile.email,
                    image: profile.picture,
                    emailVerified: profile.email_verified ? new Date() : null,
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user }) {
            const email = user.email?.toLowerCase();
            if (email && adminEmails.has(email) && user.id) {
                await db
                    .update(users)
                    .set({ role: "admin" })
                    .where(eq(users.id, user.id));
            }
            // Deny sign-in when an allowlist is set and the email is not in it
            // (admins are always admitted).
            if (
                allowedEmails.size > 0 &&
                email &&
                !allowedEmails.has(email) &&
                !adminEmails.has(email)
            ) {
                return false;
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = ((user as { role?: string }).role as "viewer" | "rescuer" | "admin" | undefined) || "viewer";
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { id?: string }).id = token.id as string | undefined;
                (session.user as { role?: string }).role =
                    (token.role as string) || "viewer";
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
};