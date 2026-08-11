import { NextResponse } from "next/server";
import { parseOverpassResponse, HealthCenter } from "@/services/healthCenters";

// Community Overpass mirrors, ordered for reliability. The main
// overpass-api.de instance is frequently overloaded/throttled, so it sits
// later in the chain; more mirrors improve the chance one responds.
const OVERPASS_ENDPOINTS = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.nchc.org.tw/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter",
];

const OVERPASS_TIMEOUT_MS = 8000;
const TOTAL_TIMEOUT_MS = 30000;

// Best-effort shared cache so repeated scans of the same area/radius/type
// reuse a result instead of re-hitting Overpass (which throttles per-IP).
// In-memory: works fully on a single Node instance, per-instance on serverless.
const HEALTH_CENTER_CACHE_TTL_MS = 10 * 60 * 1000;
const HEALTH_CENTER_CACHE_SWEEP_THRESHOLD = 500;
const healthCenterCache = new Map<string, { timestamp: number; centers: HealthCenter[] }>();

function healthCenterCacheKey(lat: number, lon: number, radius: number, type: string): string {
    // Round to ~3 decimals (~111 m) so small coordinate drift reuses the cache.
    return `health_centers_${lat.toFixed(3)}_${lon.toFixed(3)}_${radius}_${type}`;
}

function sweepHealthCenterCache(now = Date.now()): void {
    for (const [key, entry] of healthCenterCache) {
        if (now - entry.timestamp >= HEALTH_CENTER_CACHE_TTL_MS) {
            healthCenterCache.delete(key);
        }
    }
}

const CENTER_TYPES = ["all", "hospital", "pharmacy", "clinic", "health"] as const;
type CenterType = (typeof CENTER_TYPES)[number];

const LANGS = ["en", "es"] as const;
type Lang = (typeof LANGS)[number];

// Overpass filters per center type. '' = omit that branch from the query.
function typeFilters(type: CenterType): { amenity: string; healthcare: string } {
    switch (type) {
        case "hospital":
            return { amenity: "hospital", healthcare: "hospital" };
        case "pharmacy":
            return { amenity: "pharmacy", healthcare: "" };
        case "clinic":
            return { amenity: "clinic|doctors", healthcare: "clinic|centre|doctor" };
        case "health":
            return { amenity: "", healthcare: "hospital|clinic|centre|doctor" };
        case "all":
        default:
            return { amenity: "hospital|clinic|pharmacy|doctors", healthcare: "hospital|clinic|centre|doctor" };
    }
}

function buildQuery(lat: number, lon: number, radius: number, type: CenterType): string {
    const { amenity, healthcare } = typeFilters(type);
    const parts: string[] = [];

    if (amenity) {
        parts.push(`node["amenity"~"${amenity}"](around:${radius},${lat},${lon});`);
        parts.push(`way["amenity"~"${amenity}"](around:${radius},${lat},${lon});`);
    }
    if (healthcare) {
        parts.push(`node["healthcare"~"${healthcare}"](around:${radius},${lat},${lon});`);
        parts.push(`way["healthcare"~"${healthcare}"](around:${radius},${lat},${lon});`);
    }

    // `out 100` (not 20) so the nearest facilities are less likely to be
    // dropped when more than 20 exist within the radius; the client sorts.
    return `[out:json][timeout:5];(${parts.join("")});out center qt 100;`;
}

export interface QueryOutcome {
    ok: boolean;
    centers: HealthCenter[];
}

// Try the Overpass mirrors sequentially so a single scan issues one request
// when a mirror responds, instead of hammering all in parallel (Overpass
// throttles per-IP). `ok` is false only if every mirror fails. The total
// deadline keeps the worst case bounded; a valid-but-empty response is a
// genuine "nothing here".
export async function queryOverpass(
    lat: number,
    lon: number,
    radius: number,
    type: CenterType,
    lang: Lang = "en"
): Promise<QueryOutcome> {
    const query = buildQuery(lat, lon, radius, type);
    const startedAt = Date.now();

    for (const endpoint of OVERPASS_ENDPOINTS) {
        const remaining = TOTAL_TIMEOUT_MS - (Date.now() - startedAt);
        if (remaining <= 0) break;

        const controller = new AbortController();
        const timeoutId = setTimeout(
            () => controller.abort(),
            Math.min(remaining, OVERPASS_TIMEOUT_MS)
        );

        try {
            const res = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
                signal: controller.signal,
                headers: { "User-Agent": "HealthCenterApp/1.0" },
            });
            if (!res.ok) continue;

            const data = await res.json();
            return { ok: true, centers: parseOverpassResponse(data, lat, lon, lang) };
        } catch {
            continue;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    return { ok: false, centers: [] };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const latRaw = searchParams.get("lat");
    const lonRaw = searchParams.get("lon");
    if (latRaw === null || lonRaw === null) {
        return NextResponse.json({ error: "Coordinates required" }, { status: 400 });
    }

    const lat = parseFloat(latRaw);
    const lon = parseFloat(lonRaw);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const radius = parseInt(searchParams.get("radius") || "300", 10);
    const rawType = searchParams.get("type") || "all";
    const type: CenterType = CENTER_TYPES.includes(rawType as CenterType)
        ? (rawType as CenterType)
        : "all";
    const rawLang = searchParams.get("lang") || "en";
    const lang: Lang = LANGS.includes(rawLang as Lang) ? (rawLang as Lang) : "en";

    const safeRadius = Math.min(Math.max(radius, 100), 5000);

    const key = healthCenterCacheKey(lat, lon, safeRadius, type);
    const hit = healthCenterCache.get(key);
    if (hit && Date.now() - hit.timestamp < HEALTH_CENTER_CACHE_TTL_MS) {
        return NextResponse.json({ data: hit.centers });
    }

    const outcome = await queryOverpass(lat, lon, safeRadius, type, lang);

    // All mirrors failed (throttled/unreachable). Do not report a false
    // "no results" — signal the client so it can show a retry banner.
    if (!outcome.ok) {
        return NextResponse.json(
            { error: "Health centers are temporarily unavailable. Please try again." },
            { status: 503 }
        );
    }

    // Cache valid responses (including empty ones) to avoid re-scanning a
    // sparse area. Throttled 503 responses are never cached.
    healthCenterCache.set(key, { timestamp: Date.now(), centers: outcome.centers });
    if (healthCenterCache.size >= HEALTH_CENTER_CACHE_SWEEP_THRESHOLD) {
        sweepHealthCenterCache();
    }

    return NextResponse.json({ data: outcome.centers });
}
