import { eq } from "drizzle-orm";
import { canModifyProfile, getAuthUser } from "@/lib/api-auth";
import {
    jsonBadRequest,
    jsonForbidden,
    jsonNotFound,
    jsonOk,
    jsonServerError,
    jsonUnauthorized,
} from "@/lib/api-response";
import { db } from "@/lib/db/client";
import { profileSuggestions, profiles } from "@/lib/db/schema";
import {
    findProfileSuggestionWithUsers,
    toSuggestionDTO,
} from "@/lib/profile-suggestion-mapper";
import { uuidParamSchema } from "@/lib/validations/profile";

export const dynamic = "force-dynamic";

export async function POST(
    _request: Request,
    context: { params: Promise<{ uuid: string; sid: string }> }
) {
    const user = await getAuthUser();
    if (!user) return jsonUnauthorized();

    const { uuid, sid } = await context.params;

    const parsedUuid = uuidParamSchema.safeParse(uuid);
    const parsedSid = uuidParamSchema.safeParse(sid);
    if (!parsedUuid.success || !parsedSid.success) {
        return jsonBadRequest("Invalid id");
    }

    try {
        const row = await findProfileSuggestionWithUsers(parsedSid.data);
        if (!row) return jsonNotFound("Suggestion not found");
        if (row.suggestion.profileId !== parsedUuid.data) {
            return jsonBadRequest(
                "Suggestion does not belong to this profile"
            );
        }
        if (row.suggestion.status !== "pending") {
            return jsonBadRequest("Suggestion already resolved");
        }

        const profile = await db
            .select({ userId: profiles.userId })
            .from(profiles)
            .where(eq(profiles.id, parsedUuid.data))
            .limit(1);
        const profileRow = profile[0];
        if (!profileRow) return jsonNotFound("Profile not found");

        if (!canModifyProfile(user, profileRow.userId)) {
            return jsonForbidden(
                "Only the profile owner or a rescuer/admin can resolve suggestions"
            );
        }

        const [updated] = await db
            .update(profileSuggestions)
            .set({
                status: "rejected",
                resolvedAt: new Date(),
                resolvedBy: user.id,
            })
            .where(eq(profileSuggestions.id, parsedSid.data))
            .returning();

        const dto = toSuggestionDTO(updated, row.submitter, {
            name: user.name,
            fullName: user.fullName,
        });
        return jsonOk(dto);
    } catch (error) {
        console.error("POST /api/profiles/[uuid]/suggestions/[sid]/reject failed:", error);
        return jsonServerError();
    }
}