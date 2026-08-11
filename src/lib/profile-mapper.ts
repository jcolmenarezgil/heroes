import { aliasedTable, eq, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { profiles, users } from "@/lib/db/schema";
import type {
    ProfileDTO,
    PublicProfileDTO,
} from "@/types/profile";
import { canModifyProfile, type AuthUser } from "@/lib/api-auth";

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
    // photoPath is an internal storage handle and must not leak to clients.
    return {
        id: profile.id,
        userId: profile.userId,
        createdBy: profile.createdBy,
        updatedBy: profile.updatedBy,
        name: profile.name,
        photoUrl: profile.photoUrl,
        isMinor: profile.isMinor,
        lastKnownLocation: profile.lastKnownLocation,
        status: profile.status,
        latitude: profile.latitude ?? null,
        longitude: profile.longitude ?? null,
        contactPhone: profile.contactPhone,
        notes: profile.notes,
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

// Coarsen the last-known location for public display of a minor: keep only
// the segment before the first comma, falling back to the original value.
function coarsenLocation(location: string, isMinor: boolean): string {
    if (!isMinor) return location;
    const idx = location.indexOf(",");
    return idx === -1 ? location : location.slice(0, idx).trim();
}

// Privacy-safe projection of a profile. Anonymous viewers get no coordinates,
// contact, notes, or reporter identity; minors also get a coarsened location.
export function toPublicProfileDTO(
    profile: typeof profiles.$inferSelect,
    creator: { name: string | null; fullName: string } | null,
    user: AuthUser | null
): PublicProfileDTO {
    const isPublicView = user === null;
    return {
        id: profile.id,
        name: profile.name,
        photoUrl: profile.photoUrl,
        lastKnownLocation: coarsenLocation(
            profile.lastKnownLocation,
            profile.isMinor
        ),
        latitude: isPublicView || profile.isMinor ? null : (profile.latitude ?? null),
        longitude: isPublicView || profile.isMinor ? null : (profile.longitude ?? null),
        isMinor: profile.isMinor,
        status: profile.status,
        contactPhone: isPublicView ? null : profile.contactPhone,
        notes: isPublicView ? null : profile.notes,
        verified: profile.verified ? profile.verified.toISOString() : null,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
        createdByName: isPublicView
            ? ""
            : resolveDisplayName(
                  creator?.name,
                  creator?.fullName,
                  profile.createdBy
              ),
        canEdit: user ? canModifyProfile(user, profile.userId) : false,
    };
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
