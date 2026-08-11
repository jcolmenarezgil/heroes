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
const CACHE_TTL_MS = 10 * 60 * 1000;

interface CachedCenters {
    timestamp: number;
    data: HealthCenter[];
}

function cacheKey(lat: number, lon: number, radius: number, type: string): string {
    // Round to ~3 decimals (~111 m) so small GPS drift reuses the same cache.
    return `health_centers_${lat.toFixed(3)}_${lon.toFixed(3)}_${radius}_${type}`;
}

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
    type: HealthCenterType = "all",
    lang: string = "en"
): Promise<HealthCenterFetchResult> {
    try {
        // Reuse a recent result for the same area/radius/type so repeat scans
        // do not keep hitting Overpass (which throttles per-IP).
        const key = cacheKey(lat, lon, radiusMeters, type);
        const cached = await getStoredData<CachedCenters>(key);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return { centers: cached.data, ok: true };
        }

        const response = await fetch(
            `/api/health-centers?lat=${lat}&lon=${lon}&radius=${radiusMeters}&type=${type}&lang=${lang}`,
            { method: "GET", headers: { Accept: "application/json" } }
        );

        if (!response.ok) return { centers: [], ok: false };

        const result = await response.json();
        const centers: HealthCenter[] = result.data || [];

        // Cache valid responses (including empty ones) to avoid re-scanning a
        // sparse area. Throttled 503 responses are never cached.
        await setStoredData<CachedCenters>(key, {
            timestamp: Date.now(),
            data: centers,
        });

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

export function parseOverpassResponse(
    data: OverpassResponse,
    userLat: number,
    userLon: number,
    lang: string = "en"
): HealthCenter[] {
    if (!data?.elements || !Array.isArray(data.elements)) return [];

    const uniqueMap = new Map<string, HealthCenter>();

    for (const elem of data.elements) {
        const lat = elem.lat ?? elem.center?.lat;
        const lon = elem.lon ?? elem.center?.lon;
        if (lat === undefined || lon === undefined) continue;

        const rawType = elem.tags?.amenity || elem.tags?.healthcare || "health";
        const type = normalizeType(rawType);
        const name = elem.tags?.name || getDefaultName(type, lang);
        const key = `${name.toLowerCase()}-${lat.toFixed(3)}-${lon.toFixed(3)}`;

        if (!uniqueMap.has(key)) {
            const rawPhone = elem.tags?.phone || elem.tags?.["contact:phone"];
            // Drop OSM noise (e.g. "No Disponible") that is not a real number.
            const phone = rawPhone && /\d{6,}/.test(rawPhone) ? rawPhone : undefined;

            uniqueMap.set(key, {
                id: elem.id,
                name,
                type,
                lat,
                lon,
                address: elem.tags?.["addr:street"]
                    ? `${elem.tags["addr:street"]} ${elem.tags["addr:housenumber"] || ""}`.trim()
                    : undefined,
                phone,
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

const DEFAULT_NAMES: Record<string, Record<string, string>> = {
    en: {
        hospital: "Hospital / Medical Center",
        pharmacy: "Pharmacy",
        clinic: "Clinic / Health Post",
        health: "Health Center",
    },
    es: {
        hospital: "Hospital / Centro Médico",
        pharmacy: "Farmacia",
        clinic: "Clínica / Ambulatorio",
        health: "Punto de Atención Médica",
    },
};

function getDefaultName(type: string, lang: string): string {
    const names = DEFAULT_NAMES[lang] ?? DEFAULT_NAMES.en;
    return names[type] ?? names.health;
}
