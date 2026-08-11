import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    fetchHealthCentersSingleRadius,
    parseOverpassResponse,
    getLastKnownCache,
    HealthCenter,
} from "../healthCenters";
import * as dbModule from "@/lib/db/indexedDB";

vi.mock("@/lib/db/indexedDB", () => ({
    getStoredData: vi.fn(),
    setStoredData: vi.fn(),
}));

const createMockOverpassResponse = (count: number) => ({
    elements: Array.from({ length: count }, (_, i) => ({
        id: 1000 + i,
        type: "node" as const,
        lat: 10.123 + i * 0.001,
        lon: -68.123 + i * 0.001,
        tags: {
            name: `Centro de Salud ${i}`,
            amenity: i % 2 === 0 ? "hospital" : "clinic",
            phone: "+12025550143",
            "addr:street": "Main Street",
        },
    })),
});

describe("Health Centers Service & Parsing Performance", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("should process and map 1,000 Overpass elements in under 50ms", () => {
        const mockResponse = createMockOverpassResponse(1000);
        const userLat = 10.123;
        const userLon = -68.123;

        const startTime = performance.now();
        const centers = parseOverpassResponse(mockResponse, userLat, userLon);
        const endTime = performance.now();

        const executionTime = endTime - startTime;

        expect(centers).toHaveLength(1000);
        expect(centers[0]).toHaveProperty("id");
        expect(centers[0]).toHaveProperty("distance");
        expect(executionTime).toBeLessThan(50);
    });

    it("should return ok=false with an empty list if all Overpass endpoints fail", async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error("Network Error"));

        const result = await fetchHealthCentersSingleRadius(10.48, -66.90, 5000);

        expect(result.ok).toBe(false);
        expect(result.centers).toEqual([]);
    });

    it("should save successfully fetched network data into IndexedDB", async () => {
        const mockCenters: HealthCenter[] = [
            {
                id: 1000,
                name: "Centro de Salud 0",
                type: "hospital",
                lat: 10.123,
                lon: -68.123,
                distance: 0,
            },
            {
                id: 1001,
                name: "Centro de Salud 1",
                type: "clinic",
                lat: 10.124,
                lon: -68.124,
                distance: 0.14,
            },
        ];

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ data: mockCenters }),
        } as Response);

        const setStoredDataSpy = vi.spyOn(dbModule, "setStoredData");

        const results = await fetchHealthCentersSingleRadius(10.123, -68.123, 3000);

        expect(results.ok).toBe(true);
        expect(results.centers).toHaveLength(2);
        expect(setStoredDataSpy).toHaveBeenCalledWith(
            "health_centers_last_known_v1",
            expect.objectContaining({
                data: expect.arrayContaining([
                    expect.objectContaining({ id: 1000 }),
                ]),
                lastCoords: { lat: 10.123, lon: -68.123 },
            })
        );
    });

    it("should return saved cache via getLastKnownCache", async () => {
        const mockCachedEntry = {
            timestamp: Date.now(),
            data: [
                {
                    id: 99,
                    name: "Cached Health Center",
                    type: "hospital" as const,
                    lat: 10.123,
                    lon: -68.123,
                    distance: 0.5,
                },
            ],
            lastCoords: { lat: 10.123, lon: -68.123 },
        };

        vi.spyOn(dbModule, "getStoredData").mockResolvedValue(mockCachedEntry);

        const cached = await getLastKnownCache();

        expect(cached).not.toBeNull();
        expect(cached?.data[0].name).toBe("Cached Health Center");
    });
});

describe("fetchHealthCentersSingleRadius caching", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("returns cached data without calling the API when the cache is fresh", async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
        vi.mocked(dbModule.getStoredData).mockResolvedValue({
            timestamp: Date.now(),
            data: [
                {
                    id: 7,
                    name: "Cached Facility",
                    type: "hospital" as const,
                    lat: 10.48,
                    lon: -66.9,
                    distance: 1,
                },
            ],
        } as never);

        const result = await fetchHealthCentersSingleRadius(10.48, -66.9, 3000);

        expect(result.ok).toBe(true);
        expect(result.centers[0].name).toBe("Cached Facility");
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("fetches from the API when the cached entry is stale", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ data: [] }),
            } as Response)
        );
        vi.mocked(dbModule.getStoredData).mockResolvedValue({
            timestamp: Date.now() - 60 * 60 * 1000,
            data: [],
        } as never);

        const result = await fetchHealthCentersSingleRadius(10.48, -66.9, 3000);

        expect(result.ok).toBe(true);
    });

    it("does not cache a throttled (503) response", async () => {
        const setStoredDataSpy = vi.mocked(dbModule.setStoredData);
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 }))
        );
        vi.mocked(dbModule.getStoredData).mockResolvedValue(null as never);

        const result = await fetchHealthCentersSingleRadius(10.48, -66.9, 3000);

        expect(result.ok).toBe(false);
        expect(setStoredDataSpy).not.toHaveBeenCalled();
    });
});