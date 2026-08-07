import type { profileSuggestions } from "@/lib/db/schema";

/**
 * A suggestion as serialized by the API. Dates are ISO strings over the wire.
 * `userId`/`resolvedBy` identifiers are intentionally hidden from clients;
 * only display names are exposed.
 */
export type ProfileSuggestionDTO = Omit<
    typeof profileSuggestions.$inferSelect,
    "userId" | "resolvedBy" | "createdAt" | "resolvedAt"
> & {
    createdAt: string;
    resolvedAt: string | null;
    submitterDisplayName: string | null;
    resolverDisplayName: string | null;
};

export interface ProfileSuggestionListResponse {
    suggestions: ProfileSuggestionDTO[];
    total: number;
    pendingCount: number;
    page: number;
    totalPages: number;
}