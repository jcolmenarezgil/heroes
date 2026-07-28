import Dexie, { type EntityTable } from "dexie";
import type { ProfileDTO } from "@/types/profile";

/**
 * Local-first read cache for profiles (IndexedDB via Dexie).
 *
 * - The home/search UI reads from this cache first.
 * - `syncProfiles` refreshes it in the background when online, throttled to
 *   one sync every CACHE_TTL_MS; it fully replaces the cached rows so profiles
 *   deleted on the server disappear locally too.
 * - When offline (or logged out), the previous cache is kept as-is.
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const SYNC_LIMIT = 200;
const LAST_SYNC_KEY = "profilesLastSync";

interface CacheMeta {
    key: string;
    value: string;
}

const db = new Dexie("heroes") as Dexie & {
    profiles: EntityTable<ProfileDTO, "id">;
    meta: EntityTable<CacheMeta, "key">;
};

db.version(1).stores({
    profiles: "id, name, updatedAt",
    meta: "key",
});

async function getLastSync(): Promise<number | null> {
    const row = await db.meta.get(LAST_SYNC_KEY);
    const millis = row ? Number(row.value) : NaN;
    return Number.isFinite(millis) ? millis : null;
}

/**
 * Case-insensitive search over the cached profiles, newest first
 * (mirrors the server ordering: createdAt desc, id desc).
 */
export async function searchCachedProfiles(
    query = ""
): Promise<ProfileDTO[]> {
    const all = await db.profiles.toArray();
    const q = query.trim().toLowerCase();
    const filtered = q
        ? all.filter((p) => p.name.toLowerCase().includes(q))
        : all;
    return filtered.sort(
        (a, b) =>
            b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)
    );
}

/**
 * Fetches the newest profiles from the server and replaces the local cache.
 *
 * Returns true when the cache was actually refreshed. Returns false when the
 * sync was skipped (offline, cache still fresh, or not authenticated — in
 * which case the existing cache is preserved). Throws on server errors so the
 * caller can surface them when there is no cached data to fall back to.
 */
export async function syncProfiles(isOnline: boolean): Promise<boolean> {
    if (!isOnline) return false;

    const lastSync = await getLastSync();
    if (lastSync !== null && Date.now() - lastSync < CACHE_TTL_MS) {
        return false; // cache is still fresh
    }

    const res = await fetch(`/api/profiles?limit=${SYNC_LIMIT}`);
    if (res.status === 401) return false; // logged out: keep existing cache
    if (!res.ok) throw new Error(`Profile sync failed: ${res.status}`);

    const body = (await res.json()) as {
        data?: { profiles?: ProfileDTO[] };
    };
    const rows = body.data?.profiles ?? [];

    await db.transaction("rw", db.profiles, db.meta, async () => {
        await db.profiles.clear(); // drops profiles deleted on the server
        await db.profiles.bulkPut(rows);
        await db.meta.put({ key: LAST_SYNC_KEY, value: String(Date.now()) });
    });

    return true;
}
