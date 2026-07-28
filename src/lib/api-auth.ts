import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

type Role = "viewer" | "rescuer" | "admin";

export interface AuthUser {
    id: string;
    email: string;
    role: Role;
}

/**
 * Returns the authenticated user with a fresh role from the database.
 * The JWT role is not trusted for authorization because it is only set
 * at login time and can become stale (e.g. after signIn role promotion).
 */
export async function getAuthUser(): Promise<AuthUser | null> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const email = session?.user?.email;

    if (!userId || !email) return null;

    const rows = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    const role = (rows[0]?.role as Role | undefined) ?? "viewer";
    return { id: userId, email, role };
}

/**
 * Whether the user is allowed to modify (PUT/DELETE) the given profile.
 * Owners can modify their own profile; rescuer/admin can modify any.
 */
export function canModifyProfile(user: AuthUser, profileUserId: string): boolean {
    return user.id === profileUserId || user.role === "rescuer" || user.role === "admin";
}
