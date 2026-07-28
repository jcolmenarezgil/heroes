import { desc } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";
import {
    jsonForbidden,
    jsonOk,
    jsonServerError,
    jsonUnauthorized,
} from "@/lib/api-response";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
    const user = await getAuthUser();
    if (!user) return jsonUnauthorized();
    if (user.role !== "admin") return jsonForbidden("Admin only");

    try {
        const rows = await db
            .select()
            .from(profiles)
            .orderBy(desc(profiles.createdAt), desc(profiles.id));

        return jsonOk({
            profiles: rows,
            total: rows.length,
            exportedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("GET /api/profiles/export failed:", error);
        return jsonServerError();
    }
}
