import type { profiles } from "@/lib/db/schema";

// Profile as serialized by the API (dates are ISO strings over the wire).
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

// Privacy-safe public projection. Omits identifiers; minors get a coarsened
// location with null coordinates, and anonymous viewers get no contact,
// notes, or reporter name.
export interface PublicProfileDTO {
    id: string;
    name: string;
    photoUrl: string | null;
    lastKnownLocation: string;
    latitude: number | null;
    longitude: number | null;
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
