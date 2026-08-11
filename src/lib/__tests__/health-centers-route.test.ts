import { describe, expect, it, vi, afterEach } from "vitest";
import { queryOverpass } from "@/app/api/health-centers/route";

function overpassBody(count: number): string {
    return JSON.stringify({
        elements: Array.from({ length: count }, (_, i) => ({
            id: 2000 + i,
            type: "node",
            lat: 10.48 + i * 0.001,
            lon: -66.9 + i * 0.001,
            tags: { name: `Facility ${i}`, amenity: "hospital" },
        })),
    });
}

function okResponse(body: string): Response {
    return new Response(body, { status: 200 });
}

describe("queryOverpass (health centers)", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("reports ok=false when every mirror is throttled (429)", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(new Response("rate limited", { status: 429 }))
        );
        const outcome = await queryOverpass(10.48, -66.9, 300, "all");
        expect(outcome.ok).toBe(false);
        expect(outcome.centers).toEqual([]);
    });

    it("reports ok=false when every mirror throws", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
        const outcome = await queryOverpass(10.48, -66.9, 300, "all");
        expect(outcome.ok).toBe(false);
    });

    it("returns data from the first mirror and does not call the others", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(okResponse(overpassBody(2)))
            .mockResolvedValue(new Response("rate limited", { status: 429 }));
        vi.stubGlobal("fetch", fetchMock);

        const outcome = await queryOverpass(10.48, -66.9, 300, "all");

        expect(outcome.ok).toBe(true);
        expect(outcome.centers).toHaveLength(2);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("falls through to the next mirror when the first is throttled", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(new Response("rate limited", { status: 429 }))
            .mockResolvedValueOnce(okResponse(overpassBody(1)));
        vi.stubGlobal("fetch", fetchMock);

        const outcome = await queryOverpass(10.48, -66.9, 300, "all");

        expect(outcome.ok).toBe(true);
        expect(outcome.centers).toHaveLength(1);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("treats a valid empty response as a genuine empty result", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse(overpassBody(0))));
        const outcome = await queryOverpass(10.48, -66.9, 300, "all");
        expect(outcome.ok).toBe(true);
        expect(outcome.centers).toEqual([]);
    });
});
