import { db } from "@/lib/db/client";
import { photos } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/api-auth";
import {
    jsonBadRequest,
    jsonForbidden,
    jsonOk,
    jsonServerError,
    jsonUnauthorized,
} from "@/lib/api-response";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB (after client-side compression)
const ALLOWED_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

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
        return jsonBadRequest("File too large. Max size: 2 MB.");
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString("base64");

        const [row] = await db
            .insert(photos)
            .values({
                userId: user.id,
                mime: file.type,
                data: base64,
                size: buffer.length,
            })
            .returning({ id: photos.id });

        if (!row) return jsonServerError("Could not store photo");

        return jsonOk({
            url: `/api/photos/${row.id}`,
            path: row.id,
        });
    } catch (error) {
        console.error("POST /api/profiles/upload failed:", error);
        return jsonServerError();
    }
}