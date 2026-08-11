// Lightweight in-memory sliding-window rate limiter. Best-effort on
// serverless (per-instance), intended to deter spam and bulk scraping. Keys
// are namespaced per route. Expired hits are pruned on access and a full
// sweep runs once the bucket map grows past a threshold.

interface Bucket {
    hits: number[];
    windowMs: number;
}

const buckets = new Map<string, Bucket>();

const SWEEP_THRESHOLD = 5000;

export function resetRateLimits(): void {
    buckets.clear();
}

// Client IP from x-forwarded-for (first entry), x-real-ip, then "unknown".
export function getClientIp(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        const first = forwarded.split(",")[0]?.trim();
        if (first) return first;
    }
    return request.headers.get("x-real-ip") ?? "unknown";
}

// Record a hit for `key` and report whether the caller is now over the limit.
export function isRateLimited(
    key: string,
    max: number,
    windowMs: number,
    now = Date.now()
): boolean {
    let bucket = buckets.get(key);
    if (!bucket || bucket.windowMs !== windowMs) {
        bucket = { hits: [], windowMs };
        buckets.set(key, bucket);
    }

    bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

    if (bucket.hits.length >= max) {
        return true;
    }

    bucket.hits.push(now);

    if (buckets.size >= SWEEP_THRESHOLD) {
        sweepRateLimits(now);
    }

    return false;
}

// Drop all buckets whose hits are fully outside their window.
export function sweepRateLimits(now = Date.now()): void {
    for (const [key, bucket] of buckets) {
        bucket.hits = bucket.hits.filter((t) => now - t < bucket.windowMs);
        if (bucket.hits.length === 0) {
            buckets.delete(key);
        }
    }
}
