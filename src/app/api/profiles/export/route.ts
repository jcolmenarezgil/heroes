import { desc } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";
import {
    jsonForbidden,
    jsonOk,
    jsonServerError,
    jsonUnauthorized,
} from "@/lib/api-response";
import { profiles } from "@/lib/db/schema";
import { listProfilesWithUsers, toProfileDTO } from "@/lib/profile-mapper";

export const dynamic = "force-dynamic";

export async function GET() {
    const user = await getAuthUser();
    if (!user) return jsonUnauthorized();
    if (user.role !== "admin") return jsonForbidden("Admin only");

    try {
        const rows = await listProfilesWithUsers({
            orderBy: [desc(profiles.createdAt), desc(profiles.id)],
            limit: Number.MAX_SAFE_INTEGER,
            offset: 0,
        });

        const profileDtos = rows.map(({ profile, creator, updater }) =>
            toProfileDTO(profile, creator, updater)
        );

        return jsonOk({
            profiles: profileDtos,
            total: profileDtos.length,
            exportedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("GET /api/profiles/export failed:", error);
        return jsonServerError();
    }
}
