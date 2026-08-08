import { create } from "zustand";
import { HealthCenter } from "@/services/healthCenters";

interface HealthCentersState {
    centers: Map<number, HealthCenter>;
    lastFetchedLocation: { lat: number; lon: number } | null;
    isLoading: boolean;
    error: string | null;

    fetchCenters: (lat: number, lon: number) => Promise<void>;
    getSortedCenters: (userLat: number, userLon: number) => HealthCenter[];
}

export const useHealthCentersStore = create<HealthCentersState>((set, get) => ({
    centers: new Map(),
    lastFetchedLocation: null,
    isLoading: false,
    error: null,

    getSortedCenters: (userLat: number, userLon: number) => {
        const { centers } = get();
        return Array.from(centers.values())
            .map((center) => ({
                ...center,
                distance: parseFloat(
                    calculateHaversineDistance(userLat, userLon, center.lat, center.lon).toFixed(2)
                ),
            }))
            .sort((a, b) => a.distance - b.distance);
    },

    fetchCenters: async (lat: number, lon: number) => {
        const { lastFetchedLocation, isLoading, centers } = get();

        if (lastFetchedLocation) {
            const distMoved = calculateHaversineDistance(
                lastFetchedLocation.lat,
                lastFetchedLocation.lon,
                lat,
                lon
            );
            if (distMoved < 0.5 && centers.size > 0) return;
        }

        if (isLoading) return;

        set({ isLoading: true, error: null, lastFetchedLocation: { lat, lon } });

        try {
            const res = await fetch(`/api/health-centers/stream?lat=${lat}&lon=${lon}`);
            if (!res.ok) throw new Error("Failed to fetch health centers");

            const data: HealthCenter[] = await res.json();

            const newMap = new Map<number, HealthCenter>();
            for (const item of data) {
                newMap.set(item.id, item);
            }

            set({ centers: newMap, isLoading: false });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Error fetching health centers";
            set({ error: message, isLoading: false });
        }
    },
}));

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}