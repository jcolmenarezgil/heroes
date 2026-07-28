import { aliasedTable, eq, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { profiles, users } from "@/lib/db/schema";
import type { ProfileDTO } from "@/types/profile";

const creators = aliasedTable(users, "creators");
const updaters = aliasedTable(users, "updaters");

export function resolveDisplayName(
    name: string | null | undefined,
    fullName: string | null | undefined,
    userId: string
): string {
    return fullName || name || userId || "User not found";
}

export function toProfileDTO(
    profile: typeof profiles.$inferSelect,
    creator: { name: string | null; fullName: string } | null,
    updater: { name: string | null; fullName: string } | null
): ProfileDTO {
    return {
        ...profile,
        verified: profile.verified ? profile.verified.toISOString() : null,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
        createdByName: resolveDisplayName(
            creator?.name,
            creator?.fullName,
            profile.createdBy
        ),
        updatedByName: resolveDisplayName(
            updater?.name,
            updater?.fullName,
            profile.updatedBy
        ),
    };
}

export async function findProfileWithUsers(uuid: string) {
    const rows = await db
        .select({
            profile: profiles,
            creator: creators,
            updater: updaters,
        })
        .from(profiles)
        .leftJoin(creators, eq(creators.id, profiles.createdBy))
        .leftJoin(updaters, eq(updaters.id, profiles.updatedBy))
        .where(eq(profiles.id, uuid))
        .limit(1);

    return rows[0] ?? null;
}

export async function listProfilesWithUsers(options: {
    where?: SQL<unknown>;
    orderBy: SQL<unknown>[];
    limit: number;
    offset: number;
}) {
    return db
        .select({
            profile: profiles,
            creator: creators,
            updater: updaters,
        })
        .from(profiles)
        .leftJoin(creators, eq(creators.id, profiles.createdBy))
        .leftJoin(updaters, eq(updaters.id, profiles.updatedBy))
        .where(options.where)
        .orderBy(...options.orderBy)
        .limit(options.limit)
        .offset(options.offset);
}
