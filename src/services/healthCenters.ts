import { getStoredData, setStoredData } from "@/lib/db/indexedDB";

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

const OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

const LAST_KNOWN_CACHE_KEY = "health_centers_last_known_v1";

export async function getLastKnownCache(): Promise<CachedDataEntry | null> {
    return await getStoredData<CachedDataEntry>(LAST_KNOWN_CACHE_KEY);
}

export async function fetchHealthCentersSingleRadius(
    lat: number,
    lon: number,
    radiusMeters: number
): Promise<HealthCenter[]> {
    try {
        const response = await fetch(
            `/api/health-centers/stream?lat=${lat}&lon=${lon}&radius=${radiusMeters}`,
            { method: "GET", headers: { Accept: "application/json" } }
        );

        if (!response.ok) return [];

        const result = await response.json();
        const centers: HealthCenter[] = result.data || [];

        if (centers.length > 0) {
            await setStoredData<CachedDataEntry>(LAST_KNOWN_CACHE_KEY, {
                timestamp: Date.now(),
                data: centers,
                lastCoords: { lat, lon },
            });
        }

        return centers;
    } catch {
        return [];
    }
}

export function parseOverpassResponse(data: any, userLat: number, userLon: number): HealthCenter[] {
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
                distance: parseFloat(calculateDistance(userLat, userLon, lat, lon).toFixed(2)),
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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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