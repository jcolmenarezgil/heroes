import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

type Role = "viewer" | "rescuer" | "admin";

export interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    fullName: string;
    role: Role;
}

// Returns the authenticated user with a fresh role/name from the DB. The JWT
// role is not trusted because it can go stale after sign-in promotions.
export async function getAuthUser(): Promise<AuthUser | null> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const email = session?.user?.email;

    if (!userId || !email) return null;

    const rows = await db
        .select({ role: users.role, name: users.name, fullName: users.fullName })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    const row = rows[0];
    const role = (row?.role as Role | undefined) ?? "viewer";
    const name = row?.name ?? null;
    const fullName = row?.fullName ?? "";
    return { id: userId, email, name, fullName, role };
}

// Whether the user may modify (PUT/DELETE) the given profile: the owner, or
// any rescuer/admin.
export function canModifyProfile(user: AuthUser, profileUserId: string): boolean {
    return user.id === profileUserId || user.role === "rescuer" || user.role === "admin";
}
