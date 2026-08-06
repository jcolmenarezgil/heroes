/**
 * Notification helpers.
 *
 * Centralized creation of notification rows. All callers must go through
 * `createNotification` to keep payload typing consistent.
 */
import { db } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";
import type { NotificationPayload, NotificationType } from "@/lib/notification-mapper";

/** Minimum fields every notification must carry. */
interface BaseInput {
    userId: string;
    type: NotificationType;
    profileId?: string | null;
    actorId?: string | null;
    payload: NotificationPayload;
}

/**
 * Drizzle client shape. Both `db` and a transaction object expose `.insert`,
 * so we only need to type the surface we use.
 */
interface NotificationExecutor {
    insert: (typeof db)["insert"];
}

/** Insert a notification row. */
export async function createNotification(
    executor: NotificationExecutor,
    input: BaseInput
): Promise<void> {
    // The Drizzle JSONB column is typed as `Record<string, unknown>` for
    // storage compatibility; cast the strict payload at the boundary.
    await executor.insert(notifications).values({
        userId: input.userId,
        type: input.type,
        profileId: input.profileId ?? null,
        actorId: input.actorId ?? null,
        payload: input.payload as unknown as Record<string, unknown>,
    });
}
