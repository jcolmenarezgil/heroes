import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the DB-backed finder so we exercise the real projection logic without a
// database. The real `toPublicProfileDTO` is preserved via importActual.
vi.mock("@/lib/profile-mapper", async () => {
    const actual = await vi.importActual<typeof import("@/lib/profile-mapper")>(
        "@/lib/profile-mapper"
    );
    return {
        ...actual,
        findProfileWithUsers: vi.fn(),
    };
});

// Mock auth; we toggle getAuthUser per case to simulate anon vs. signed-in.
vi.mock("@/lib/api-auth", async () => {
    const actual = await vi.importActual<typeof import("@/lib/api-auth")>(
        "@/lib/api-auth"
    );
    return {
        ...actual,
        getAuthUser: vi.fn(),
    };
});

// Stub the auth config so DrizzleAdapter (which needs a real db) is never
// constructed at import time.
vi.mock("@/lib/auth", () => ({
    authOptions: {} as unknown,
}));

// The route module imports `db` transitively via the mapper; stub the client so
// no real connection is attempted at import time.
vi.mock("@/lib/db/client", () => ({
    db: {},
}));

import { getAuthUser } from "@/lib/api-auth";
import { findProfileWithUsers } from "@/lib/profile-mapper";
import { GET } from "@/app/api/public/profiles/[uuid]/route";

const UUID = "11111111-1111-1111-1111-111111111111";

function makeRow(isMinor = false) {
    return {
        profile: {
            id: UUID,
            userId: "22222222-2222-2222-2222-222222222222",
            createdBy: "33333333-3333-3333-3333-333333333333",
            updatedBy: "33333333-3333-3333-3333-333333333333",
            name: "Maria Perez",
            photoUrl: null,
            photoPath: null,
            isMinor,
            lastKnownLocation: "Caracas, Distrito Capital",
            latitude: 10.4806,
            longitude: -66.9036,
            status: "active" as const,
            contactPhone: "+58 555-1234",
            notes: "Wearing a red jacket.",
            verified: null,
            createdAt: new Date("2024-01-01T00:00:00.000Z"),
            updatedAt: new Date("2024-01-02T00:00:00.000Z"),
        },
        creator: { name: "Ana", fullName: "Ana Lopez" },
        updater: { name: "Ana", fullName: "Ana Lopez" },
    };
}

async function callGet(uuid: string) {
    const res = await GET(new Request("http://localhost/"), {
        params: Promise.resolve({ uuid }),
    });
    return res.json() as Promise<{ data?: Record<string, unknown>; error?: string }>;
}

describe("GET /api/public/profiles/[uuid]", () => {
    beforeEach(() => {
        vi.mocked(findProfileWithUsers).mockReset();
        vi.mocked(getAuthUser).mockReset();
    });

    it("hides sensitive fields and coords for anonymous viewers", async () => {
        vi.mocked(findProfileWithUsers).mockResolvedValue(makeRow() as never);
        vi.mocked(getAuthUser).mockResolvedValue(null);

        const body = await callGet(UUID);
        expect(body.data).toBeDefined();
        const dto = body.data!;
        expect(dto.latitude).toBeNull();
        expect(dto.longitude).toBeNull();
        expect(dto.contactPhone).toBeNull();
        expect(dto.notes).toBeNull();
        expect(dto.createdByName).toBe("");
        expect(dto.canEdit).toBe(false);
    });

    it("keeps sensitive fields and coords for authenticated viewers", async () => {
        vi.mocked(findProfileWithUsers).mockResolvedValue(makeRow() as never);
        vi.mocked(getAuthUser).mockResolvedValue({
            id: "44444444-4444-4444-4444-444444444444",
            email: "ana@example.com",
            name: "Ana",
            fullName: "Ana Lopez",
            role: "viewer",
        } as never);

        const body = await callGet(UUID);
        const dto = body.data!;
        expect(dto.latitude).toBe(10.4806);
        expect(dto.longitude).toBe(-66.9036);
        expect(dto.contactPhone).toBe("+58 555-1234");
        expect(dto.notes).toBe("Wearing a red jacket.");
        expect(dto.createdByName).toBe("Ana Lopez");
        expect(dto.canEdit).toBe(false); // viewer, not owner/rescuer/admin
    });

    it("nulls coords and coarsens location for minors", async () => {
        vi.mocked(findProfileWithUsers).mockResolvedValue(makeRow(true) as never);
        vi.mocked(getAuthUser).mockResolvedValue(null);

        const body = await callGet(UUID);
        const dto = body.data!;
        expect(dto.latitude).toBeNull();
        expect(dto.longitude).toBeNull();
        expect(dto.lastKnownLocation).toBe("Caracas");
    });

    it("returns 404 when the profile does not exist", async () => {
        vi.mocked(findProfileWithUsers).mockResolvedValue(null as never);
        vi.mocked(getAuthUser).mockResolvedValue(null);

        const res = await GET(new Request("http://localhost/"), {
            params: Promise.resolve({ uuid: UUID }),
        });
        expect(res.status).toBe(404);
    });

    it("rejects an invalid uuid with 400", async () => {
        const res = await GET(new Request("http://localhost/"), {
            params: Promise.resolve({ uuid: "not-a-uuid" }),
        });
        expect(res.status).toBe(400);
    });
});