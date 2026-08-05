import { db } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";

export interface CreateNotificationInput {
    userId: string;
    type:
        | "suggestion.created"
        | "suggestion.resolved"
        | "profile.verified"
        | "profile.unverified"
        | "profile.merged";
    profileId?: string;
    actorId?: string;
    payload: Record<string, unknown>;
}

interface NotificationTx {
    insert: typeof db.insert;
}

export async function createNotification(
    tx: NotificationTx,
    input: CreateNotificationInput
) {
    await tx.insert(notifications).values({
        userId: input.userId,
        type: input.type,
        profileId: input.profileId ?? null,
        actorId: input.actorId ?? null,
        payload: input.payload,
    });
}