import type { profiles } from "@/lib/db/schema";

/**
 * Profile as serialized by the API (dates are ISO strings over the wire).
 */
export type ProfileDTO = Omit<
    typeof profiles.$inferSelect,
    "photoPath" | "verified" | "createdAt" | "updatedAt"
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

/**
 * Public-facing, privacy-safe projection of a profile.
 * Omits identifiers (userId, createdBy, updatedBy) and, when the profile
 * is flagged as a minor, exposes only the coarse region of lastKnownLocation.
 */
export interface PublicProfileDTO {
    id: string;
    name: string;
    photoUrl: string | null;
    lastKnownLocation: string;
    isMinor: boolean;
    status: "active" | "found" | "deceased";
    contactPhone: string | null;
    notes: string | null;
    verified: string | null;
    createdAt: string;
    updatedAt: string;
    createdByName: string;
    /** Whether the current session may edit this profile. */
    canEdit: boolean;
}
