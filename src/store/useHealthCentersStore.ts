// src/store/useHealthCentersStore.ts
import { create } from "zustand";
import { HealthCenter } from "@/services/healthCenters";

interface HealthCentersState {
    centers: Map<number, HealthCenter>;
    lastFetchedLocation: { lat: number; lon: number } | null;
    isStreaming: boolean;
    error: string | null;

    startStreaming: (lat: number, lon: number) => void;
    getSortedCenters: (userLat: number, userLon: number) => HealthCenter[];
}

export const useHealthCentersStore = create<HealthCentersState>((set, get) => ({
    centers: new Map(),
    lastFetchedLocation: null,
    isStreaming: false,
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

    startStreaming: (lat: number, lon: number) => {
        const { lastFetchedLocation, isStreaming, centers } = get();

        if (lastFetchedLocation) {
            const distMoved = calculateHaversineDistance(
                lastFetchedLocation.lat,
                lastFetchedLocation.lon,
                lat,
                lon
            );
            if (distMoved < 0.5 && centers.size > 0) {
                return;
            }
        }

        if (isStreaming) return;

        set({ isStreaming: true, error: null, lastFetchedLocation: { lat, lon } });

        const eventSource = new EventSource(`/api/health-centers/stream?lat=${lat}&lon=${lon}`);

        eventSource.onmessage = (event) => {
            if (event.data === "[DONE]") {
                eventSource.close();
                set({ isStreaming: false });
                return;
            }

            try {
                const incomingData = JSON.parse(event.data);
                const list: HealthCenter[] = Array.isArray(incomingData)
                    ? incomingData
                    : Array.isArray(incomingData?.data)
                        ? incomingData.data
                        : [];

                if (list.length > 0) {
                    set((state) => {
                        const newMap = new Map(state.centers);
                        for (const item of list) {
                            newMap.set(item.id, item);
                        }
                        return { centers: newMap };
                    });
                }
            } catch (err) {
                console.error("[useHealthCentersStore] Error parsing SSE chunk:", err);
            }
        };

        eventSource.onerror = (err) => {
            console.error("[useHealthCentersStore] SSE connection error:", err);
            eventSource.close();
            set({ isStreaming: false });
        };
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