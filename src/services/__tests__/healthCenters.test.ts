import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    fetchHealthCentersSingleRadius,
    parseOverpassResponse,
    getLastKnownCache,
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

    it("should return an empty array if all Overpass endpoints fail", async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error("Network Error"));

        const result = await fetchHealthCentersSingleRadius(10.48, -66.90, 5000);

        expect(result).toEqual([]);
    });

    it("should save successfully fetched network data into IndexedDB", async () => {
        const mockResponse = createMockOverpassResponse(2);

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockResponse,
        } as Response);

        const setStoredDataSpy = vi.spyOn(dbModule, "setStoredData");

        const results = await fetchHealthCentersSingleRadius(10.123, -68.123, 3000);

        expect(results).toHaveLength(2);
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