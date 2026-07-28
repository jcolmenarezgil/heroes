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
import { profiles } from "@/lib/db/schema";
import {
    updateProfileSchema,
    uuidParamSchema,
} from "@/lib/validations/profile";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{ uuid: string }>;
}

async function getProfileOr404(uuid: string) {
    const rows = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, uuid))
        .limit(1);
    return rows[0] ?? null;
}

export async function GET(_request: Request, context: RouteContext) {
    const user = await getAuthUser();
    if (!user) return jsonUnauthorized();

    const { uuid } = await context.params;
    const parsedUuid = uuidParamSchema.safeParse(uuid);
    if (!parsedUuid.success) {
        return jsonBadRequest("Invalid profile id");
    }

    try {
        const profile = await getProfileOr404(parsedUuid.data);
        if (!profile) return jsonNotFound("Profile not found");
        return jsonOk(profile);
    } catch (error) {
        console.error("GET /api/profiles/[uuid] failed:", error);
        return jsonServerError();
    }
}

export async function PUT(request: Request, context: RouteContext) {
    const user = await getAuthUser();
    if (!user) return jsonUnauthorized();

    const { uuid } = await context.params;
    const parsedUuid = uuidParamSchema.safeParse(uuid);
    if (!parsedUuid.success) {
        return jsonBadRequest("Invalid profile id");
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return jsonBadRequest("Invalid JSON body");
    }

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
        return jsonBadRequest("Invalid profile data", parsed.error.issues);
    }

    if (Object.keys(parsed.data).length === 0) {
        return jsonBadRequest("No fields to update");
    }

    try {
        const profile = await getProfileOr404(parsedUuid.data);
        if (!profile) return jsonNotFound("Profile not found");

        if (!canModifyProfile(user, profile.userId)) {
            return jsonForbidden("You can only modify your own profiles");
        }

        const updateData: Record<string, unknown> = {};
        const { name, photoUrl, lastKnownLocation, status, contactPhone, notes } =
            parsed.data;

        if (name !== undefined) updateData.name = name;
        if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
        if (lastKnownLocation !== undefined)
            updateData.lastKnownLocation = lastKnownLocation;
        if (status !== undefined) updateData.status = status;
        if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
        if (notes !== undefined) updateData.notes = notes;

        const [updated] = await db
            .update(profiles)
            .set(updateData)
            .where(eq(profiles.id, parsedUuid.data))
            .returning();

        return jsonOk(updated);
    } catch (error) {
        console.error("PUT /api/profiles/[uuid] failed:", error);
        return jsonServerError();
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    const user = await getAuthUser();
    if (!user) return jsonUnauthorized();

    const { uuid } = await context.params;
    const parsedUuid = uuidParamSchema.safeParse(uuid);
    if (!parsedUuid.success) {
        return jsonBadRequest("Invalid profile id");
    }

    try {
        const profile = await getProfileOr404(parsedUuid.data);
        if (!profile) return jsonNotFound("Profile not found");

        // owner can delete their own profile; rescuer/admin can delete any
        if (!canModifyProfile(user, profile.userId)) {
            return jsonForbidden("You can only delete your own profiles");
        }

        await db.delete(profiles).where(eq(profiles.id, parsedUuid.data));

        return jsonOk({ deleted: true, id: parsedUuid.data });
    } catch (error) {
        console.error("DELETE /api/profiles/[uuid] failed:", error);
        return jsonServerError();
    }
}
