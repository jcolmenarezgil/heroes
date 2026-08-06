import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";
import {
    jsonForbidden,
    jsonNotFound,
    jsonOk,
    jsonServerError,
    jsonUnauthorized,
} from "@/lib/api-response";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { createNotification } from "@/lib/notification-helpers";
import { findProfileWithUsers, toProfileDTO } from "@/lib/profile-mapper";
import { uuidParamSchema } from "@/lib/validations/profile";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{ uuid: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
    const user = await getAuthUser();
    if (!user) return jsonUnauthorized();
    if (user.role !== "admin") return jsonForbidden("Admin only");

    const { uuid } = await context.params;
    const parsedUuid = uuidParamSchema.safeParse(uuid);
    if (!parsedUuid.success) {
        return jsonServerError("Invalid profile id");
    }

    try {
        const row = await findProfileWithUsers(parsedUuid.data);
        if (!row) return jsonNotFound("Profile not found");

        const [updated] = await db
            .update(profiles)
            .set({ verified: new Date(), updatedBy: user.id })
            .where(eq(profiles.id, parsedUuid.data))
            .returning();

        const dto = toProfileDTO(updated, user, user);

        // Notify the profile owner.
        if (updated.userId && updated.userId !== user.id) {
            await createNotification(db, {
                userId: updated.userId,
                type: "profile.verified",
                profileId: parsedUuid.data,
                actorId: user.id,
                payload: { profileName: updated.name ?? "", href: `/p/${parsedUuid.data}` },
            });
        }

        return jsonOk(dto);
    } catch (error) {
        console.error("POST /api/admin/profiles/[uuid]/verify failed:", error);
        return jsonServerError();
    }
}