import { aliasedTable, eq, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
    profileSuggestions,
    profiles,
    users,
} from "@/lib/db/schema";
import type { ProfileSuggestionDTO } from "@/types/profile-suggestion";
import { resolveDisplayName } from "./profile-mapper";

const submitters = aliasedTable(users, "submitters");
const resolvers = aliasedTable(users, "resolvers");

export function toSuggestionDTO(
    suggestion: typeof profileSuggestions.$inferSelect,
    submitter: { name: string | null; fullName: string } | null,
    resolver: { name: string | null; fullName: string } | null
): ProfileSuggestionDTO {
    return {
        id: suggestion.id,
        profileId: suggestion.profileId,
        submitterName: suggestion.submitterName,
        submitterContact: suggestion.submitterContact,
        note: suggestion.note,
        status: suggestion.status,
        createdAt: suggestion.createdAt.toISOString(),
        resolvedAt: suggestion.resolvedAt
            ? suggestion.resolvedAt.toISOString()
            : null,
        submitterDisplayName: suggestion.userId
            ? resolveDisplayName(
                  submitter?.name,
                  submitter?.fullName,
                  suggestion.userId
              )
            : suggestion.submitterName ?? null,
        resolverDisplayName: suggestion.resolvedBy
            ? resolveDisplayName(
                  resolver?.name,
                  resolver?.fullName,
                  suggestion.resolvedBy
              )
            : null,
    };
}

export async function findProfileSuggestionWithUsers(id: string) {
    const rows = await db
        .select({
            suggestion: profileSuggestions,
            submitter: submitters,
            resolver: resolvers,
        })
        .from(profileSuggestions)
        .leftJoin(submitters, eq(submitters.id, profileSuggestions.userId))
        .leftJoin(resolvers, eq(resolvers.id, profileSuggestions.resolvedBy))
        .where(eq(profileSuggestions.id, id))
        .limit(1);
    return rows[0] ?? null;
}

export async function listProfileSuggestionsWithUsers(options: {
    where?: SQL<unknown>;
    orderBy: SQL<unknown>[];
    limit: number;
    offset: number;
}) {
    return db
        .select({
            suggestion: profileSuggestions,
            submitter: submitters,
            resolver: resolvers,
        })
        .from(profileSuggestions)
        .leftJoin(submitters, eq(submitters.id, profileSuggestions.userId))
        .leftJoin(
            resolvers,
            eq(resolvers.id, profileSuggestions.resolvedBy)
        )
        .where(options.where)
        .orderBy(...options.orderBy)
        .limit(options.limit)
        .offset(options.offset);
}

export async function profileExists(profileId: string): Promise<boolean> {
    const rows = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.id, profileId))
        .limit(1);
    return rows.length > 0;
}