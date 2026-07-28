import type { profiles } from "@/lib/db/schema";

/**
 * Profile as serialized by the API (dates are ISO strings over the wire).
 */
export type ProfileDTO = Omit<
    typeof profiles.$inferSelect,
    "verified" | "createdAt" | "updatedAt"
> & {
    verified: string | null;
    createdAt: string;
    updatedAt: string;
    createdByName: string;
    updatedByName: string;
};

export interface ProfileListResponse {
    profiles: ProfileDTO[];
    total: number;
    page: number;
    totalPages: number;
}
