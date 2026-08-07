// src/lib/api-client.ts
import type {
    CreateProfileInput,
    UpdateProfileInput,
} from "@/lib/validations/profile";
import type { UpdateUserInput } from "@/lib/validations/user";
import type { ProfileDTO, PublicProfileDTO, ProfileListResponse } from "@/types/profile";
import type {
    ProfileSuggestionDTO,
    ProfileSuggestionListResponse,
} from "@/types/profile-suggestion";
import { compressImage } from "@/lib/compress-image";
import type { UserDTO, AdminUserListResponse } from "@/types/user";
import type { NotificationListResponse } from "@/lib/notification-mapper";

export class ApiError extends Error {
    constructor(
        public status: number,
        message: string
    ) {
        super(message);
        this.name = "ApiError";
    }
}

async function request<T>(
    path: string,
    init?: RequestInit
): Promise<T> {
    const isFormData =
        typeof FormData !== "undefined" && init?.body instanceof FormData;

    const res = await fetch(path, {
        ...init,
        headers: isFormData
            ? init?.headers
            : {
                  "Content-Type": "application/json",
                  ...init?.headers,
              },
    });

    const body = (await res.json().catch(() => null)) as
        | { data?: T; error?: string }
        | null;

    if (!res.ok) {
        throw new ApiError(
            res.status,
            body?.error ?? `Request failed with status ${res.status}`
        );
    }

    return body?.data as T;
}

export interface ListProfilesParams {
    q?: string;
    status?: "active" | "found" | "deceased";
    createdBy?: string;
    page?: number;
    limit?: number;
}

export function listProfiles(
    params: ListProfilesParams = {}
): Promise<ProfileListResponse> {
    const search = new URLSearchParams();
    if (params.q) search.set("q", params.q);
    if (params.status) search.set("status", params.status);
    if (params.createdBy) search.set("createdBy", params.createdBy);
    if (params.page) search.set("page", String(params.page));
    if (params.limit) search.set("limit", String(params.limit));

    const qs = search.toString();
    return request<ProfileListResponse>(
        `/api/profiles${qs ? `?${qs}` : ""}`
    );
}

export function getProfile(id: string): Promise<ProfileDTO> {
    return request<ProfileDTO>(`/api/profiles/${id}`);
}

export function getPublicProfile(id: string): Promise<PublicProfileDTO> {
    return request<PublicProfileDTO>(`/api/public/profiles/${id}`);
}

export function createProfile(data: CreateProfileInput): Promise<ProfileDTO> {
    return request<ProfileDTO>("/api/profiles", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function updateProfile(
    id: string,
    data: UpdateProfileInput
): Promise<ProfileDTO> {
    return request<ProfileDTO>(`/api/profiles/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export interface UploadPhotoResponse {
    url: string;
    path: string;
}

export async function uploadProfilePhoto(
    file: File
): Promise<UploadPhotoResponse> {
    const compressed = await compressImage(file);
    const formData = new FormData();
    formData.append("file", compressed);
    formData.append("hasAuthorization", "true");
    return request<UploadPhotoResponse>("/api/profiles/upload", {
        method: "POST",
        body: formData,
    });
}

export function getMe(): Promise<UserDTO> {
    return request<UserDTO>("/api/users/me");
}

export function updateMe(data: UpdateUserInput): Promise<UserDTO> {
    return request<UserDTO>("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

export interface CreateSuggestionInput {
    submitterName?: string;
    submitterContact?: string;
    note: string;
}

export function createSuggestion(
    profileId: string,
    data: CreateSuggestionInput
): Promise<ProfileSuggestionDTO> {
    return request<ProfileSuggestionDTO>(`/api/profiles/${profileId}/suggestions`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function listSuggestions(
    profileId: string,
    params: { status?: "pending" | "approved" | "rejected"; page?: number; limit?: number } = {}
): Promise<ProfileSuggestionListResponse> {
    const search = new URLSearchParams();
    if (params.status) search.set("status", params.status);
    if (params.page) search.set("page", String(params.page));
    if (params.limit) search.set("limit", String(params.limit));
    const qs = search.toString();
    return request<ProfileSuggestionListResponse>(
        `/api/profiles/${profileId}/suggestions${qs ? `?${qs}` : ""}`
    );
}

export function approveSuggestion(
    profileId: string,
    suggestionId: string
): Promise<ProfileSuggestionDTO> {
    return request<ProfileSuggestionDTO>(
        `/api/profiles/${profileId}/suggestions/${suggestionId}/approve`,
        { method: "POST" }
    );
}

export function rejectSuggestion(
    profileId: string,
    suggestionId: string
): Promise<ProfileSuggestionDTO> {
    return request<ProfileSuggestionDTO>(
        `/api/profiles/${profileId}/suggestions/${suggestionId}/reject`,
        { method: "POST" }
    );
}

export function verifyProfile(uuid: string): Promise<ProfileDTO> {
    return request<ProfileDTO>(`/api/admin/profiles/${uuid}/verify`, {
        method: "POST",
    });
}

export function unverifyProfile(uuid: string): Promise<ProfileDTO> {
    return request<ProfileDTO>(`/api/admin/profiles/${uuid}/unverify`, {
        method: "POST",
    });
}

export function mergeProfiles(
    source: string,
    target: string
): Promise<{ merged: boolean; source: string; target: string }> {
    return request(`/api/admin/profiles/merge`, {
        method: "POST",
        body: JSON.stringify({ source, target }),
    });
}

export interface ListAdminUsersParams {
    q?: string;
    role?: "all" | "viewer" | "rescuer" | "admin";
    page?: number;
    limit?: number;
}

export function listAdminUsers(
    params: ListAdminUsersParams = {}
): Promise<AdminUserListResponse> {
    const search = new URLSearchParams();
    if (params.q) search.set("q", params.q);
    if (params.role) search.set("role", params.role);
    if (params.page) search.set("page", String(params.page));
    if (params.limit) search.set("limit", String(params.limit));

    const qs = search.toString();
    return request<AdminUserListResponse>(
        `/api/admin/users${qs ? `?${qs}` : ""}`
    );
}

export function updateUserRole(
    userId: string,
    role: "viewer" | "rescuer" | "admin"
): Promise<UserDTO> {
    return request<UserDTO>(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
    });
}

export interface ListNotificationsParams {
    limit?: number;
    page?: number;
    unreadOnly?: boolean;
}

export function getNotifications(
    params: ListNotificationsParams = {}
): Promise<NotificationListResponse> {
    const search = new URLSearchParams();
    if (params.limit) search.set("limit", String(params.limit));
    if (params.page) search.set("page", String(params.page));
    if (params.unreadOnly) search.set("unreadOnly", "true");

    const qs = search.toString();
    return request<NotificationListResponse>(
        `/api/notifications${qs ? `?${qs}` : ""}`
    );
}

export function markNotificationsRead(input: {
    ids?: string[];
    all?: true;
}): Promise<{ updated: number }> {
    return request<{ updated: number }>(`/api/notifications/mark-read`, {
        method: "POST",
        body: JSON.stringify(input),
    });
}
