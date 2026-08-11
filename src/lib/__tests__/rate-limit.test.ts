import { describe, expect, it, beforeEach } from "vitest";
import {
    getClientIp,
    isRateLimited,
    resetRateLimits,
    sweepRateLimits,
} from "@/lib/rate-limit";

describe("isRateLimited", () => {
    beforeEach(() => resetRateLimits());

    it("allows requests under the limit", () => {
        for (let i = 0; i < 3; i++) {
            expect(isRateLimited("k", 5, 1000, 0)).toBe(false);
        }
    });

    it("rejects once the limit is reached within the window", () => {
        for (let i = 0; i < 5; i++) {
            expect(isRateLimited("k", 5, 1000, 0)).toBe(false);
        }
        expect(isRateLimited("k", 5, 1000, 0)).toBe(true);
        expect(isRateLimited("k", 5, 1000, 900)).toBe(true);
    });

    it("forgets hits outside the window", () => {
        for (let i = 0; i < 5; i++) {
            expect(isRateLimited("k", 5, 1000, 0)).toBe(false);
        }
        // Exactly at the window edge the hit is no longer counted.
        expect(isRateLimited("k", 5, 1000, 1000)).toBe(false);
    });

    it("keeps namespaces independent", () => {
        for (let i = 0; i < 5; i++) {
            isRateLimited("a", 5, 1000, 0);
        }
        expect(isRateLimited("b", 5, 1000, 0)).toBe(false);
    });

    it("sweeps expired buckets", () => {
        isRateLimited("old", 5, 1000, 0);
        sweepRateLimits(5000);
        expect(isRateLimited("old", 5, 1000, 6000)).toBe(false);
    });
});

describe("getClientIp", () => {
    it("returns the first x-forwarded-for entry", () => {
        const req = new Request("http://localhost/", {
            headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
        });
        expect(getClientIp(req)).toBe("1.2.3.4");
    });

    it("falls back to x-real-ip", () => {
        const req = new Request("http://localhost/", {
            headers: { "x-real-ip": "9.9.9.9" },
        });
        expect(getClientIp(req)).toBe("9.9.9.9");
    });

    it("falls back to unknown", () => {
        const req = new Request("http://localhost/");
        expect(getClientIp(req)).toBe("unknown");
    });
});
