// src/utils/geo.ts
import type { Coordinates } from "@/types/map";

export function calculateHaversineDistance(
    coord1: Coordinates,
    coord2: Coordinates
): number {
    const R = 6371e3;
    const rad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = rad(coord2.latitude - coord1.latitude);
    const dLon = rad(coord2.longitude - coord1.longitude);

    const lat1 = rad(coord1.latitude);
    const lat2 = rad(coord2.latitude);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c); 
}