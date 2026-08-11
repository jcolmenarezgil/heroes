// Downscale and re-encode an image to WebP before upload so photos stay
// small in the base64 Postgres column.

const MAX_DIMENSION = 1280;
const WEBP_QUALITY = 0.82;

export async function compressImage(file: File): Promise<File> {
    if (typeof window === "undefined" || typeof document === "undefined") {
        return file;
    }

    // Skip the work for an already-small WebP.
    if (file.type === "image/webp" && file.size <= 256 * 1024) {
        return file;
    }

    try {
        const bitmap = await loadBitmap(file);
        const { width, height } = fitWithin(bitmap, MAX_DIMENSION);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return file;
        ctx.drawImage(bitmap, 0, 0, width, height);

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/webp", WEBP_QUALITY)
        );

        if ("close" in bitmap && typeof bitmap.close === "function") {
            (bitmap as ImageBitmap).close();
        }

        if (!blob) return file;

        const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
        return new File([blob], name, { type: "image/webp" });
    } catch {
        return file;
    }
}

function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
    if (typeof createImageBitmap === "function") {
        return createImageBitmap(file);
    }
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Could not decode image"));
        };
        img.src = url;
    });
}

function fitWithin(
    source: { width: number; height: number },
    max: number
): { width: number; height: number } {
    const { width, height } = source;
    if (width <= max && height <= max) {
        return { width, height };
    }
    const scale = max / Math.max(width, height);
    return {
        width: Math.round(width * scale),
        height: Math.round(height * scale),
    };
}