import { getAuthUser } from "@/lib/api-auth";
import {
    jsonBadRequest,
    jsonNotFound,
    jsonOk,
    jsonServerError,
} from "@/lib/api-response";
import { findProfileWithUsers, toPublicProfileDTO } from "@/lib/profile-mapper";
import { uuidParamSchema } from "@/lib/validations/profile";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{ uuid: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
    const { uuid } = await context.params;
    const parsedUuid = uuidParamSchema.safeParse(uuid);
    if (!parsedUuid.success) {
        return jsonBadRequest("Invalid profile id");
    }

    try {
        const row = await findProfileWithUsers(parsedUuid.data);
        if (!row) return jsonNotFound("Profile not found");

        // Session is optional; when present we also return `canEdit` so the
        // client knows whether to show the edit affordance.
        const authUser = await getAuthUser().catch(() => null);
        const dto = toPublicProfileDTO(row.profile, row.creator, authUser);
        return jsonOk(dto);
    } catch (error) {
        console.error("GET /api/public/profiles/[uuid] failed:", error);
        return jsonServerError();
    }
}