import { describe, it, expect } from "vitest";
import { calculateHaversineDistance } from "../geo";
import type { Coordinates } from "@/types/map";

describe("Geo Utilities - calculateHaversineDistance", () => {
    it("should return 0 when calculating distance to the same point", () => {
        const point: Coordinates = { latitude: 10.123, longitude: -68.123 };

        const distance = calculateHaversineDistance(point, point);

        expect(distance).toBe(0);
    });

    it("should correctly calculate the approximate distance in meters between two coordinates", () => {
        const caracas: Coordinates = { latitude: 10.4806, longitude: -66.9036 };
        const barquisimeto: Coordinates = { latitude: 10.0647, longitude: -69.357 };

        const distanceMeters = calculateHaversineDistance(caracas, barquisimeto);

        expect(distanceMeters).toBeGreaterThan(260_000);
        expect(distanceMeters).toBeLessThan(280_000);
    });
});