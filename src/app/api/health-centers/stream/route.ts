import { NextResponse } from "next/server";
import { parseOverpassResponse, HealthCenter } from "@/services/healthCenters";

const OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lon = parseFloat(searchParams.get("lon") || "0");
    const radius = parseInt(searchParams.get("radius") || "300", 10);

    if (!lat || !lon) {
        return NextResponse.json({ error: "Coordenadas requeridas" }, { status: 400 });
    }

    const safeRadius = Math.min(Math.max(radius, 100), 5000);
    const query = `[out:json][timeout:5];
    (
      node["amenity"~"hospital|clinic|pharmacy|doctors"](around:${safeRadius},${lat},${lon});
      way["amenity"~"hospital|clinic|pharmacy|doctors"](around:${safeRadius},${lat},${lon});
      node["healthcare"~"hospital|clinic|centre|doctor"](around:${safeRadius},${lat},${lon});
    );
    out center qt 20;`;

    for (const endpoint of OVERPASS_ENDPOINTS) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
                signal: controller.signal,
                headers: { "User-Agent": "HealthCenterApp/1.0" },
            });

            clearTimeout(timeoutId);
            if (!res.ok) continue;

            const data = await res.json();
            const centers: HealthCenter[] = parseOverpassResponse(data, lat, lon);

            return NextResponse.json({ data: centers });
        } catch {
            continue;
        }
    }

    return NextResponse.json({ data: [] });
}