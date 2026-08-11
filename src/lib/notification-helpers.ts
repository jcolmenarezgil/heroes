// Centralized notification creation so every call keeps a typed payload.
import { db } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";
import type { NotificationPayload, NotificationType } from "@/lib/notification-mapper";

// Minimum fields every notification must carry.
interface BaseInput {
    userId: string;
    type: NotificationType;
    profileId?: string | null;
    actorId?: string | null;
    payload: NotificationPayload;
}

// Works with both the db client and a transaction object.
interface NotificationExecutor {
    insert: (typeof db)["insert"];
}

export async function createNotification(
    executor: NotificationExecutor,
    input: BaseInput
): Promise<void> {
    // The JSONB column is typed loosely; cast the strict payload here.
    await executor.insert(notifications).values({
        userId: input.userId,
        type: input.type,
        profileId: input.profileId ?? null,
        actorId: input.actorId ?? null,
        payload: input.payload as unknown as Record<string, unknown>,
    });
}
