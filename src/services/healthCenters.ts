// src/services/healthCenters.ts

export interface HealthCenter {
    id: number;
    name: string;
    type: string;
    lat: number;
    lon: number;
    address?: string;
    phone?: string;
    distance: number;
}

interface OverpassElement {
    id: number;
    type: "node" | "way" | "relation";
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: {
        name?: string;
        amenity?: string;
        healthcare?: string;
        "addr:street"?: string;
        "addr:housenumber"?: string;
        phone?: string;
        "contact:phone"?: string;
    };
}

interface OverpassResponse {
    elements?: OverpassElement[];
}

const OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
];

const cache = new Map<string, { timestamp: number; data: HealthCenter[] }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function fetchNearbyHealthCenters(
    lat: number,
    lon: number,
    radiusMeters: number = 8000
): Promise<HealthCenter[]> {
    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}-${radiusMeters}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
    }

    const query = `[out:json][timeout:12];
    (
      nwr["amenity"~"hospital|clinic|pharmacy|doctors|dentist"](around:${radiusMeters},${lat},${lon});
      nwr["healthcare"~"hospital|clinic|centre|doctor|pharmacy"](around:${radiusMeters},${lat},${lon});
    );
    out center qt 100;`;

    const fetchFromEndpoint = async (endpoint: string): Promise<HealthCenter[]> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": "HeroesApp/1.0",
                },
                body: `data=${encodeURIComponent(query)}`,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP error ${response.status}`);

            const data: OverpassResponse = await response.json();
            const centers = parseOverpassResponse(data, lat, lon);

            if (centers.length === 0) throw new Error("No centers found");
            return centers;
        } catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    };

    try {
        const centers = await Promise.any(OVERPASS_ENDPOINTS.map(fetchFromEndpoint));
        cache.set(cacheKey, { timestamp: Date.now(), data: centers });
        return centers;
    } catch {
        console.warn("[HealthCenters] All Overpass endpoints failed or timed out.");
        return [];
    }
}

function parseOverpassResponse(data: OverpassResponse, userLat: number, userLon: number): HealthCenter[] {
    if (!data.elements || !Array.isArray(data.elements)) return [];

    const uniqueCenters = new Map<string, HealthCenter>();

    for (const elem of data.elements) {
        const lat = elem.lat ?? elem.center?.lat;
        const lon = elem.lon ?? elem.center?.lon;
        if (lat === undefined || lon === undefined) continue;

        const name = elem.tags?.name || "Health Center";
        const type = elem.tags?.amenity || elem.tags?.healthcare || "health";
        const key = `${name.toLowerCase()}-${lat.toFixed(3)}-${lon.toFixed(3)}`;

        if (!uniqueCenters.has(key)) {
            uniqueCenters.set(key, {
                id: elem.id,
                name,
                type: normalizeType(type),
                lat,
                lon,
                address: elem.tags?.["addr:street"]
                    ? `${elem.tags["addr:street"]} ${elem.tags["addr:housenumber"] || ""}`.trim()
                    : undefined,
                phone: elem.tags?.phone || elem.tags?.["contact:phone"],
                distance: parseFloat(calculateHaversineDistance(userLat, userLon, lat, lon).toFixed(2)),
            });
        }
    }

    return Array.from(uniqueCenters.values()).sort((a, b) => a.distance - b.distance);
}

function normalizeType(type: string): string {
    if (type.includes("hospital")) return "hospital";
    if (type.includes("pharmacy")) return "pharmacy";
    if (type.includes("clinic") || type.includes("centre") || type.includes("doctor")) return "clinic";
    return "health";
}

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