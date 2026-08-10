import { NextResponse } from "next/server";
import { parseOverpassResponse, HealthCenter } from "@/services/healthCenters";

const OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

const OVERPASS_TIMEOUT_MS = 12000;

const CENTER_TYPES = ["all", "hospital", "pharmacy", "clinic", "health"] as const;
type CenterType = (typeof CENTER_TYPES)[number];

// Filtros de Overpass por tipo de centro. '' = no incluir esa rama en la consulta.
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
    }

    return `[out:json][timeout:5];(${parts.join("")});out center qt 20;`;
}

// Resuelve con el primer resultado no vacío; si todos fallan o llegan vacíos, resuelve [].
function firstNonEmpty(attempts: Promise<HealthCenter[] | null>[]): Promise<HealthCenter[]> {
    return new Promise((resolve) => {
        if (attempts.length === 0) return resolve([]);

        let settled = 0;
        for (const attempt of attempts) {
            attempt.then((result) => {
                if (result && result.length > 0) {
                    resolve(result);
                    return;
                }
                settled += 1;
                if (settled === attempts.length) resolve([]);
            });
        }
    });
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lon = parseFloat(searchParams.get("lon") || "0");
    const radius = parseInt(searchParams.get("radius") || "300", 10);
    const rawType = searchParams.get("type") || "all";
    const type: CenterType = CENTER_TYPES.includes(rawType as CenterType)
        ? (rawType as CenterType)
        : "all";

    if (!lat || !lon) {
        return NextResponse.json({ error: "Coordenadas requeridas" }, { status: 400 });
    }

    const safeRadius = Math.min(Math.max(radius, 100), 5000);
    const query = buildQuery(lat, lon, safeRadius, type);

    const attempts = OVERPASS_ENDPOINTS.map(async (endpoint) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);

        try {
            const res = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
                signal: controller.signal,
                headers: { "User-Agent": "HealthCenterApp/1.0" },
            });

            if (!res.ok) return null;

            const data = await res.json();
            return parseOverpassResponse(data, lat, lon);
        } catch {
            return null;
        } finally {
            clearTimeout(timeoutId);
        }
    });

    const centers = await firstNonEmpty(attempts);

    return NextResponse.json({ data: centers });
}
