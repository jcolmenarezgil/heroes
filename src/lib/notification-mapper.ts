/**
 * Notification types and DTOs.
 *
 * The notifications table has a `payload` jsonb column that holds
 * type-specific context. Each notification type has its own payload shape
 * with a strict TypeScript interface so the UI can rely on typed access.
 */
import type { notifications } from "@/lib/db/schema";

/** Discriminator string stored in `notifications.type`. */
export type NotificationType =
    | "suggestion.created"
    | "suggestion.resolved"
    | "profile.verified"
    | "profile.unverified"
    | "profile.merged";

/** Payload for `suggestion.created` (notify the profile owner). */
export interface SuggestionCreatedPayload {
    profileName: string;
    /** Deep-link target. Always starts with `/p/`. */
    href: string;
}

/** Payload for `suggestion.resolved` (notify submitter + owner). */
export interface SuggestionResolvedPayload {
    profileName: string;
    resolution: "approved" | "rejected";
    /** Deep-link target. Always starts with `/p/`. */
    href: string;
}

/** Payload for `profile.verified` (notify profile owner). */
export interface ProfileVerifiedPayload {
    profileName: string;
    /** Deep-link target. Always starts with `/p/`. */
    href: string;
}

/** Payload for `profile.unverified` (notify profile owner). */
export interface ProfileUnverifiedPayload {
    profileName: string;
    /** Deep-link target. Always starts with `/p/`. */
    href: string;
}

/** Payload for `profile.merged` (notify source profile owner). */
export interface ProfileMergedPayload {
    sourceProfileName: string;
    targetProfileName: string;
    /** Deep-link target. Always starts with `/p/<target_uuid>`. */
    href: string;
}

/** Discriminated union of all notification (type, payload) variants. */
export type NotificationVariant =
    | { type: "suggestion.created"; payload: SuggestionCreatedPayload }
    | { type: "suggestion.resolved"; payload: SuggestionResolvedPayload }
    | { type: "profile.verified"; payload: ProfileVerifiedPayload }
    | { type: "profile.unverified"; payload: ProfileUnverifiedPayload }
    | { type: "profile.merged"; payload: ProfileMergedPayload };

/** Map from notification type to its payload shape. */
export type NotificationPayloadOf<T extends NotificationType> =
    Extract<NotificationVariant, { type: T }>["payload"];

/** All payload shapes (union). */
export type NotificationPayload = NotificationVariant["payload"];

/** Shape returned to the client. */
export interface NotificationDTO {
    id: string;
    userId: string;
    type: NotificationType;
    profileId: string | null;
    actorId: string | null;
    payload: NotificationPayload | null;
    readAt: string | null;
    createdAt: string;
}

export interface NotificationListResponse {
    notifications: NotificationDTO[];
    unreadCount: number;
    total: number;
    page: number;
    totalPages: number;
}

/** Map a raw DB row to a client DTO. */
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
