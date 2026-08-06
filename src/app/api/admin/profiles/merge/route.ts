import { and, eq, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";
import {
    jsonBadRequest,
    jsonForbidden,
    jsonNotFound,
    jsonOk,
    jsonServerError,
    jsonUnauthorized,
} from "@/lib/api-response";
import { db } from "@/lib/db/client";
import { photos, profileSuggestions, profiles } from "@/lib/db/schema";
import { createNotification } from "@/lib/notification-helpers";
import { mergeProfilesSchema } from "@/lib/validations/admin";

export const dynamic = "force-dynamic";

/**
 * Merge a duplicate profile (`source`) into a canonical one (`target`).
 *
 * - Moves non-approved suggestions from `source` to `target`.
 * - When `target` has no photo, adopts the source's photo (photoPath/photoUrl).
 * - Appends the source notes to the target's notes for audit purposes.
 * - Deletes the source profile (cascades to its photos and suggestions if any
 *   were left behind).
 */
export async function POST(request: Request) {
    const user = await getAuthUser();
    if (!user) return jsonUnauthorized();
    if (user.role !== "admin") return jsonForbidden("Admin only");

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return jsonBadRequest("Invalid JSON body");
    }

    const parsed = mergeProfilesSchema.safeParse(body);
    if (!parsed.success) {
        return jsonBadRequest("Invalid merge payload", parsed.error.issues);
    }

    const { source, target } = parsed.data;
    if (source === target) {
        return jsonBadRequest("Source and target must differ");
    }

    try {
        return await db.transaction(async (tx) => {
            const rows = await tx
                .select()
                .from(profiles)
                .where(sql`${profiles.id} = ${source} or ${profiles.id} = ${target}`);
            const sourceRow = rows.find((r) => r.id === source);
            const targetRow = rows.find((r) => r.id === target);
            if (!sourceRow || !targetRow) {
                return jsonNotFound("Profile not found");
            }

            // Move pending suggestions from source to target (ignore approved
            // ones; they are historical and stay attached to the source).
            await tx
                .update(profileSuggestions)
                .set({ profileId: target })
                .where(
                    and(
                        eq(profileSuggestions.profileId, source),
                        eq(profileSuggestions.status, "pending")
                    )
                );

            // Adopt the source's photo only if the target has none.
            if (!targetRow.photoUrl && sourceRow.photoUrl) {
                await tx
                    .update(profiles)
                    .set({
                        photoUrl: sourceRow.photoUrl,
                        photoPath: sourceRow.photoPath,
                        updatedBy: user.id,
                    })
                    .where(eq(profiles.id, target));
            }

            // Append source notes to the target's notes with a clear separator.
            if (sourceRow.notes && sourceRow.notes.trim()) {
                const stamp = new Date().toISOString();
                const merged = `${targetRow.notes ?? ""}\n\n--- Merged from ${sourceRow.name} (${stamp}) ---\n${sourceRow.notes}`;
                await tx
                    .update(profiles)
                    .set({ notes: merged, updatedBy: user.id })
                    .where(eq(profiles.id, target));
            }

            // Clean up the source's orphaned photo row when we did NOT adopt it
            // (it would have been adopted above). Bypassed when adopted because
            // the photo row is now referenced by the target.
            const adoptedPhoto =
                !targetRow.photoUrl &&
                !!sourceRow.photoUrl &&
                !!sourceRow.photoPath;
            if (!adoptedPhoto && sourceRow.photoPath) {
                await tx
                    .delete(photos)
                    .where(eq(photos.id, sourceRow.photoPath))
                    .catch((err) => {
                        console.error("Failed to delete source photo:", err);
                    });
            }

            await tx.delete(profiles).where(eq(profiles.id, source));

            // Notify the source profile owner.
            if (sourceRow.userId && sourceRow.userId !== user.id) {
                await createNotification(tx, {
                    userId: sourceRow.userId,
                    type: "profile.merged",
                    profileId: source,
                    actorId: user.id,
                    payload: {
                        sourceProfileName: sourceRow.name ?? "",
                        targetProfileName: targetRow.name ?? "",
                        href: `/p/${target}`,
                    },
                });
            }

            return jsonOk({ merged: true, source, target });
        });
    } catch (error) {
        console.error("POST /api/admin/profiles/merge failed:", error);
        return jsonServerError();
    }
}