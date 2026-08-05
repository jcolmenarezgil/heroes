// src/lib/api-client.ts
import type {
    CreateProfileInput,
    UpdateProfileInput,
} from "@/lib/validations/profile";
import type { ProfileDTO, ProfileListResponse } from "@/types/profile";

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
    const res = await fetch(path, {
        ...init,
        headers: {
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
    page?: number;
    limit?: number;
}

export function listProfiles(
    params: ListProfilesParams = {}
): Promise<ProfileListResponse> {
    const search = new URLSearchParams();
    if (params.q) search.set("q", params.q);
    if (params.status) search.set("status", params.status);
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
