// Notification types and typed payloads.
import type { notifications } from "@/lib/db/schema";

// Discriminator stored in notifications.type.
export type NotificationType =
    | "suggestion.created"
    | "suggestion.resolved"
    | "profile.verified"
    | "profile.unverified"
    | "profile.merged";

// Payload for suggestion.created (notifies the profile owner).
export interface SuggestionCreatedPayload {
    profileName: string;
    href: string;
}

// Payload for suggestion.resolved (notifies submitter and owner).
export interface SuggestionResolvedPayload {
    profileName: string;
    resolution: "approved" | "rejected";
    href: string;
}

// Payload for profile.verified (notifies the profile owner).
export interface ProfileVerifiedPayload {
    profileName: string;
    href: string;
}

// Payload for profile.unverified (notifies the profile owner).
export interface ProfileUnverifiedPayload {
    profileName: string;
    href: string;
}

// Payload for profile.merged (notifies the source profile owner).
export interface ProfileMergedPayload {
    sourceProfileName: string;
    targetProfileName: string;
    href: string;
}

// Discriminated union of all (type, payload) variants.
export type NotificationVariant =
    | { type: "suggestion.created"; payload: SuggestionCreatedPayload }
    | { type: "suggestion.resolved"; payload: SuggestionResolvedPayload }
    | { type: "profile.verified"; payload: ProfileVerifiedPayload }
    | { type: "profile.unverified"; payload: ProfileUnverifiedPayload }
    | { type: "profile.merged"; payload: ProfileMergedPayload };

// Payload shape for a given notification type.
export type NotificationPayloadOf<T extends NotificationType> =
    Extract<NotificationVariant, { type: T }>["payload"];

// All payload shapes.
export type NotificationPayload = NotificationVariant["payload"];

// Shape returned to the client.
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

// Map a raw DB row to a client DTO.
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
