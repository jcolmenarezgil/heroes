import { describe, expect, it } from "vitest";
import { toPublicProfileDTO } from "@/lib/profile-mapper";

type ProfileRow = Parameters<typeof toPublicProfileDTO>[0];

function makeProfile(overrides: Partial<ProfileRow> = {}): ProfileRow {
    return {
        id: "11111111-1111-1111-1111-111111111111",
        userId: "22222222-2222-2222-2222-222222222222",
        createdBy: "33333333-3333-3333-3333-333333333333",
        updatedBy: "33333333-3333-3333-3333-333333333333",
        name: "Maria Perez",
        photoUrl: null,
        photoPath: null,
        isMinor: false,
        lastKnownLocation: "Caracas, Distrito Capital",
        latitude: 10.4806,
        longitude: -66.9036,
        status: "active",
        contactPhone: "+58 555-1234",
        notes: "Wearing a red jacket.",
        verified: null,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
        ...overrides,
    };
}

const creator = { name: "Ana", fullName: "Ana Lopez" };
const authUser = {
    id: "44444444-4444-4444-4444-444444444444",
    email: "ana@example.com",
    name: "Ana",
    fullName: "Ana Lopez",
    role: "viewer" as const,
};

describe("toPublicProfileDTO", () => {
    it("hides sensitive fields for anonymous viewers (non-minor)", () => {
        const dto = toPublicProfileDTO(makeProfile(), creator, null);
        expect(dto.contactPhone).toBeNull();
        expect(dto.notes).toBeNull();
        expect(dto.createdByName).toBe("");
        expect(dto.canEdit).toBe(false);
        // Coordinates are never exposed to anonymous viewers, even for adults.
        expect(dto.latitude).toBeNull();
        expect(dto.longitude).toBeNull();
    });

    it("keeps sensitive fields and coordinates for authenticated viewers", () => {
        const dto = toPublicProfileDTO(makeProfile(), creator, authUser);
        expect(dto.contactPhone).toBe("+58 555-1234");
        expect(dto.notes).toBe("Wearing a red jacket.");
        expect(dto.createdByName).toBe("Ana Lopez");
        expect(dto.latitude).toBe(10.4806);
        expect(dto.longitude).toBe(-66.9036);
    });

    it("nulls coordinates and coarsens location for minors", () => {
        const dto = toPublicProfileDTO(
            makeProfile({ isMinor: true }),
            creator,
            null
        );
        expect(dto.latitude).toBeNull();
        expect(dto.longitude).toBeNull();
        expect(dto.lastKnownLocation).toBe("Caracas");
    });
});
