import { fetchNearbyHealthCenters } from "@/services/healthCenters";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");

    if (!latParam || !lonParam) {
        return NextResponse.json({ error: "Missing lat or lon parameters" }, { status: 400 });
    }

    const lat = parseFloat(latParam);
    const lon = parseFloat(lonParam);

    if (isNaN(lat) || isNaN(lon)) {
        return NextResponse.json({ error: "Invalid lat or lon parameters" }, { status: 400 });
    }

    try {
        const centers = await fetchNearbyHealthCenters(lat, lon);
        return NextResponse.json(centers, {
            headers: {
                "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
            },
        });
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}