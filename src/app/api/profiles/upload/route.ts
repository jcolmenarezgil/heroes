import { put } from "@vercel/blob";
import { getAuthUser } from "@/lib/api-auth";
import {
    jsonBadRequest,
    jsonForbidden,
    jsonOk,
    jsonServerError,
    jsonUnauthorized,
} from "@/lib/api-response";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
    const user = await getAuthUser();
    if (!user) return jsonUnauthorized();

    const formData = await request.formData().catch(() => null);
    if (!formData) return jsonBadRequest("Expected multipart/form-data");

    const file = formData.get("file");
    const hasAuthorization = formData.get("hasAuthorization");

    if (hasAuthorization !== "true") {
        return jsonForbidden(
            "Image authorization consent is required to upload"
        );
    }

    if (!(file instanceof File)) {
        return jsonBadRequest("Missing 'file' field");
    }

    if (!ALLOWED_TYPES.has(file.type)) {
        return jsonBadRequest(
            "Unsupported file type. Allowed: JPEG, PNG, WebP."
        );
    }

    if (file.size > MAX_FILE_SIZE) {
        return jsonBadRequest("File too large. Max size: 5 MB.");
    }

    try {
        const uniqueName = `${user.id}/${crypto.randomUUID()}-${file.name}`;
        const blob = await put(uniqueName, file, {
            access: "public",
            addRandomSuffix: false,
            contentType: file.type,
        });

        return jsonOk({ url: blob.url, path: blob.pathname });
    } catch (error) {
        console.error("POST /api/profiles/upload failed:", error);
        return jsonServerError();
    }
}