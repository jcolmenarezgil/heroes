import type { notifications } from "@/lib/db/schema";

export type NotificationType =
    | "suggestion.created"
    | "suggestion.resolved"
    | "profile.verified"
    | "profile.unverified"
    | "profile.merged";

export interface NotificationPayload {
    profileName?: string;
    noteExcerpt?: string;
    resolution?: "approved" | "rejected";
    sourceProfileName?: string;
    targetProfileName?: string;
    // Deep-link target for the UI click handler.
    href?: string;
    [key: string]: unknown;
}

export type NotificationDTO = Omit<
    typeof notifications.$inferSelect,
    "payload" | "readAt" | "createdAt"
> & {
    type: NotificationType;
    payload: NotificationPayload | null;
    readAt: string | null;
    createdAt: string;
};

export interface NotificationListResponse {
    notifications: NotificationDTO[];
    unreadCount: number;
    total: number;
    page: number;
    totalPages: number;
}

export function toNotificationDTO(
    row: typeof notifications.$inferSelect
): NotificationDTO {
    return {
        id: row.id,
        userId: row.userId,
        type: row.type as NotificationType,
        profileId: row.profileId,
        actorId: row.actorId,
        payload: (row.payload as NotificationPayload | null) ?? null,
        readAt: row.readAt ? row.readAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
    };
}
