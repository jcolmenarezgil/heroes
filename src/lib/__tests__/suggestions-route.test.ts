import { describe, expect, it, vi, beforeEach } from "vitest";

// getAuthUser always returns null in this suite → exercises the anonymous path.
vi.mock("@/lib/api-auth", async () => {
    const actual = await vi.importActual<typeof import("@/lib/api-auth")>(
        "@/lib/api-auth"
    );
    return {
        ...actual,
        getAuthUser: vi.fn(() => Promise.resolve(null)),
    };
});

// Stub the auth config so DrizzleAdapter (which needs a real db) is never
// constructed at import time.
vi.mock("@/lib/auth", () => ({
    authOptions: {} as unknown,
}));

// Stub the DB client so no real connection happens at import time.
vi.mock("@/lib/db/client", () => ({
    db: {},
}));

import { isRateLimited, resetRateLimits } from "@/lib/rate-limit";
import {
    ANON_SUGGEST_MAX,
    ANON_SUGGEST_WINDOW_MS,
} from "@/app/api/profiles/[uuid]/suggestions/route";
import { POST } from "@/app/api/profiles/[uuid]/suggestions/route";

const UUID = "11111111-1111-1111-1111-111111111111";

async function callPost() {
    const req = new Request("http://localhost/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: "Saw this person near the park.", submitterName: "Tipster" }),
    });
    return POST(req, { params: Promise.resolve({ uuid: UUID }) });
}

describe("POST /api/profiles/[uuid]/suggestions — anonymous rate limiting", () => {
    beforeEach(() => {
        resetRateLimits();
    });

    it("returns 429 once the anonymous limit is reached", async () => {
        // Pre-fill the limiter so the next call is already over the limit.
        // Key mirrors the route's namespace: suggest:anon:<ip>.
        for (let i = 0; i < ANON_SUGGEST_MAX; i++) {
            isRateLimited(
                "suggest:anon:unknown",
                ANON_SUGGEST_MAX,
                ANON_SUGGEST_WINDOW_MS
            );
        }

        const res = await callPost();
        expect(res.status).toBe(429);
        const body = (await res.json()) as { error?: string };
        expect(body.error).toBeTruthy();
        // The route sets a Retry-After header on 429.
        expect(res.headers.get("Retry-After")).toBeTruthy();
    });

    it("does not 429 when under the limit", async () => {
        // Only one prior hit → well under ANON_SUGGEST_MAX.
        isRateLimited(
            "suggest:anon:unknown",
            ANON_SUGGEST_MAX,
            ANON_SUGGEST_WINDOW_MS
        );
        const res = await callPost();
        // Not rate-limited (and the body is valid → not a 429, not a 400).
        expect(res.status).not.toBe(429);
    });
});