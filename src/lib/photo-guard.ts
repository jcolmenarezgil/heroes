import { eq } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { db } from "@/lib/db/client";
import { photos } from "@/lib/db/schema";
import type { AuthUser } from "@/lib/api-auth";

// photoPath is a client-supplied reference to a photos row. Because photos are
// public once uploaded, we must not let a user point a profile at (and later
// delete) another person's upload. These helpers enforce photo ownership.

// Whether this user may attach `photoId` to a profile: they uploaded it, or
// they are an admin (bulk imports / management).
export async function canAttachPhoto(
    photoId: string,
    user: AuthUser
): Promise<boolean> {
    const [row] = await db
        .select({ userId: photos.userId })
        .from(photos)
        .where(eq(photos.id, photoId))
        .limit(1);
    if (!row) return false;
    return row.userId === user.id || user.role === "admin";
}

// Delete a photo only when the actor may: the uploader, the profile owner, or
// an admin. This is the guard that stops a user from destroying another
// user's photo by pointing their own profile's photoPath at it. When called
// from within a transaction, pass the transaction client so the delete is
// atomic with the surrounding work.
type DbLike = PgDatabase<
    PostgresJsQueryResultHKT,
    typeof import("@/lib/db/schema")
>;

export async function deletePhotoIfAllowed(
    photoId: string,
    profileOwnerId: string,
    user: AuthUser,
    client: DbLike = db
): Promise<void> {
    const [row] = await client
        .select({ userId: photos.userId })
        .from(photos)
        .where(eq(photos.id, photoId))
        .limit(1);
    if (!row) return;
    if (
        row.userId !== user.id &&
        row.userId !== profileOwnerId &&
        user.role !== "admin"
    ) {
        return;
    }
    await client.delete(photos).where(eq(photos.id, photoId));
}