import type { Coordinates, HealthCenter } from "@/types/map";

export async function fetchNearbyHealthCenters(
    coords: Coordinates,
    radiusInMeters: number = 5000
): Promise<HealthCenter[]> {
    const query = `[out:json][timeout:15];
(
  node["amenity"="hospital"](around:${radiusInMeters},${coords.latitude},${coords.longitude});
  node["amenity"="clinic"](around:${radiusInMeters},${coords.latitude},${coords.longitude});
);
out body 20;`;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url, {
            headers: {
                "Accept": "application/json",
                "User-Agent": "HeroesCrisisApp/1.0",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            console.warn(`Overpass API responded with status: ${response.status}`);
            throw new Error(`Error fetching medical centers (HTTP ${response.status})`);
        }

        const data = await response.json();

        if (!data || !Array.isArray(data.elements)) {
            return [];
        }

        return data.elements.map((element: any) => ({
            id: String(element.id),
            name: element.tags?.name || element.tags?.["official_name"] || "Centro Médico",
            type: element.tags?.amenity === "hospital" ? "hospital" : "clinic",
            address: element.tags?.["addr:street"]
                ? `${element.tags["addr:street"]} ${element.tags["addr:housenumber"] || ""}`.trim()
                : "Dirección no registrada",
            location: {
                latitude: element.lat,
                longitude: element.lon,
            },
        }));
    } catch (error) {
        console.error("Failed to stream health centers:", error);
        return [];
    }
}