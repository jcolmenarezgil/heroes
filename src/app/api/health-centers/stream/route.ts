// src/app/api/health-centers/stream/route.ts
import { fetchNearbyHealthCenters } from "@/services/healthCenters";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");

    if (!latParam || !lonParam) {
        return new Response(JSON.stringify({ error: "Missing lat or lon parameters" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const lat = parseFloat(latParam);
    const lon = parseFloat(lonParam);

    if (isNaN(lat) || isNaN(lon)) {
        return new Response(JSON.stringify({ error: "Invalid lat or lon parameters" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const centers = await fetchNearbyHealthCenters(lat, lon);

                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(centers)}\n\n`)
                );
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            } catch (error: unknown) {
                const err = error instanceof Error ? error : new Error("Unknown error");
                console.error("[HealthCenters Stream] Error processing request:", err.message);

                const errorMessage = JSON.stringify({
                    error: err.message || "Failed to fetch health centers",
                });
                controller.enqueue(encoder.encode(`data: ${errorMessage}\n\n`));
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}