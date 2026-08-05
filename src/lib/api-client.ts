import type {
    CreateProfileInput,
    UpdateProfileInput,
} from "@/lib/validations/profile";
import type { UpdateUserInput } from "@/lib/validations/user";
import type { ProfileDTO, ProfileListResponse } from "@/types/profile";
import type { UserDTO } from "@/types/user";

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

export function uploadProfilePhoto(
    file: File
): Promise<UploadPhotoResponse> {
    const formData = new FormData();
    formData.append("file", file);
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
