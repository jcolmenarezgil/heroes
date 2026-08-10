import { getStoredData, setStoredData } from "@/lib/db/indexedDB";
import { calculateHaversineDistance } from "@/utils/geo";

export interface HealthCenter {
    id: number;
    name: string;
    type: "hospital" | "pharmacy" | "clinic" | "health";
    lat: number;
    lon: number;
    address?: string;
    phone?: string;
    distance: number;
}

export interface CachedDataEntry {
    timestamp: number;
    data: HealthCenter[];
    lastCoords: { lat: number; lon: number };
}

const LAST_KNOWN_CACHE_KEY = "health_centers_last_known_v1";

export async function getLastKnownCache(): Promise<CachedDataEntry | null> {
    return await getStoredData<CachedDataEntry>(LAST_KNOWN_CACHE_KEY);
}

export type HealthCenterType = "all" | "hospital" | "pharmacy" | "clinic" | "health";

export interface HealthCenterFetchResult {
    centers: HealthCenter[];
    ok: boolean;
}

export async function fetchHealthCentersSingleRadius(
    lat: number,
    lon: number,
    radiusMeters: number,
    type: HealthCenterType = "all"
): Promise<HealthCenterFetchResult> {
    try {
        const response = await fetch(
            `/api/health-centers?lat=${lat}&lon=${lon}&radius=${radiusMeters}&type=${type}`,
            { method: "GET", headers: { Accept: "application/json" } }
        );

        if (!response.ok) return { centers: [], ok: false };

        const result = await response.json();
        const centers: HealthCenter[] = result.data || [];

        if (centers.length > 0) {
            await setStoredData<CachedDataEntry>(LAST_KNOWN_CACHE_KEY, {
                timestamp: Date.now(),
                data: centers,
                lastCoords: { lat, lon },
            });
        }

        return { centers, ok: true };
    } catch {
        return { centers: [], ok: false };
    }
}

interface OverpassElement {
    id: number;
    type?: string;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
}

interface OverpassResponse {
    elements?: OverpassElement[];
}

export function parseOverpassResponse(data: OverpassResponse, userLat: number, userLon: number): HealthCenter[] {
    if (!data?.elements || !Array.isArray(data.elements)) return [];

    const uniqueMap = new Map<string, HealthCenter>();

    for (const elem of data.elements) {
        const lat = elem.lat ?? elem.center?.lat;
        const lon = elem.lon ?? elem.center?.lon;
        if (lat === undefined || lon === undefined) continue;

        const rawType = elem.tags?.amenity || elem.tags?.healthcare || "health";
        const type = normalizeType(rawType);
        const name = elem.tags?.name || getDefaultName(type);
        const key = `${name.toLowerCase()}-${lat.toFixed(3)}-${lon.toFixed(3)}`;

        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, {
                id: elem.id,
                name,
                type,
                lat,
                lon,
                address: elem.tags?.["addr:street"]
                    ? `${elem.tags["addr:street"]} ${elem.tags["addr:housenumber"] || ""}`.trim()
                    : undefined,
                phone: elem.tags?.phone || elem.tags?.["contact:phone"],
                distance: parseFloat(
                    (
                        calculateHaversineDistance(
                            { latitude: userLat, longitude: userLon },
                            { latitude: lat, longitude: lon }
                        ) / 1000
                    ).toFixed(2)
                ),
            });
        }
    }

    return Array.from(uniqueMap.values()).sort((a, b) => a.distance - b.distance);
}

function normalizeType(type: string): "hospital" | "pharmacy" | "clinic" | "health" {
    if (type.includes("hospital")) return "hospital";
    if (type.includes("pharmacy")) return "pharmacy";
    if (type.includes("clinic") || type.includes("centre") || type.includes("doctor")) return "clinic";
    return "health";
}

function getDefaultName(type: string): string {
    switch (type) {
        case "hospital": return "Hospital / Centro Médico";
        case "pharmacy": return "Farmacia";
        case "clinic": return "Clínica / Ambulatorio";
        default: return "Punto de Atención Médica";
    }
}
