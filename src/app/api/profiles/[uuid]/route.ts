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
import { findProfileWithUsers, toProfileDTO } from "@/lib/profile-mapper";
import { canAttachPhoto, deletePhotoIfAllowed } from "@/lib/photo-guard";
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
        const row = await findProfileWithUsers(parsedUuid.data);
        if (!row) return jsonNotFound("Profile not found");
        const profileDto = toProfileDTO(row.profile, row.creator, row.updater);
        return jsonOk(profileDto);
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
        const {
            name,
            photoUrl,
            photoPath,
            isMinor,
            lastKnownLocation,
            latitude,
            longitude,
            status,
            contactPhone,
            notes,
        } = parsed.data;

        const newPhotoPath = photoPath !== undefined ? photoPath : profile.photoPath;
        if (newPhotoPath && newPhotoPath !== profile.photoPath) {
            const allowed = await canAttachPhoto(newPhotoPath, user);
            if (!allowed) {
                return jsonForbidden("You can only attach photos you uploaded");
            }
        }

        if (name !== undefined) updateData.name = name;
        if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
        if (photoPath !== undefined) updateData.photoPath = photoPath;
        if (isMinor !== undefined) updateData.isMinor = isMinor;
        if (lastKnownLocation !== undefined) updateData.lastKnownLocation = lastKnownLocation;
        if (latitude !== undefined) updateData.latitude = latitude;
        if (longitude !== undefined) updateData.longitude = longitude;
        if (status !== undefined) updateData.status = status;
        if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
        if (notes !== undefined) updateData.notes = notes;

        // Delete the old photo row when a new one replaces it, to avoid orphans.
        const oldPhotoId = profile.photoPath;
        if (oldPhotoId && newPhotoPath !== oldPhotoId) {
            await deletePhotoIfAllowed(oldPhotoId, profile.userId, user).catch(
                (err) => {
                    console.error("Failed to delete old photo:", err);
                }
            );
        }

        const [updated] = await db
            .update(profiles)
            .set({ ...updateData, updatedBy: user.id })
            .where(eq(profiles.id, parsedUuid.data))
            .returning();

        const profileDto = toProfileDTO(updated, user, user);
        return jsonOk(profileDto);
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

        // Owners delete their own; rescuers/admins delete any.
        if (!canModifyProfile(user, profile.userId)) {
            return jsonForbidden("You can only delete your own profiles");
        }

        // Delete the associated photo before removing the row. Only allowed
        // when the actor is the uploader, the profile owner, or an admin.
        if (profile.photoPath) {
            await deletePhotoIfAllowed(
                profile.photoPath,
                profile.userId,
                user
            ).catch((err) => {
                console.error("Failed to delete photo:", err);
            });
        }

        await db.delete(profiles).where(eq(profiles.id, parsedUuid.data));

        return jsonOk({ deleted: true, id: parsedUuid.data });
    } catch (error) {
        console.error("DELETE /api/profiles/[uuid] failed:", error);
        return jsonServerError();
    }
}
