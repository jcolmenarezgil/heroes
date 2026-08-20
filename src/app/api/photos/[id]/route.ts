import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { photos } from "@/lib/db/schema";
import { uuidParamSchema } from "@/lib/validations/profile";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
    const { id } = await context.params;
    if (!uuidParamSchema.safeParse(id).success) {
        return new Response("Invalid photo id", { status: 400 });
    }

    try {
        const rows = await db
            .select({ mime: photos.mime, data: photos.data, size: photos.size })
            .from(photos)
            .where(eq(photos.id, id))
            .limit(1);

        const row = rows[0];
        if (!row) return new Response("Not found", { status: 404 });

        const bytes = Buffer.from(row.data, "base64");

        return new Response(new Uint8Array(bytes), {
            status: 200,
            headers: {
                "Content-Type": row.mime,
                "Content-Length": String(row.size),
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("GET /api/photos/[id] failed:", error);
        return new Response("Internal server error", { status: 500 });
    }
}