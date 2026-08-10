import { z } from "zod";
import { profileSchema } from "@/lib/validations/profile";

export interface PendingSyncItem<T> {
    id: string;
    payload: T;
    status: "pending" | "syncing" | "failed";
    retryCount: number;
    lastError?: string;
    createdAt: number;
}

const DB_NAME = "heroes_app_db";
const DB_VERSION = 1;

export const STORES = {
    OUTBOX: "profile_outbox",
    CACHE: "kv_store",
} as const;

/**
 * Inicialización unificada de IndexedDB con múltiples Object Stores
 */
export const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined" || !window.indexedDB) {
            return reject(new Error("IndexedDB no está disponible en este entorno"));
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Store 1: Cola de sincronización offline (Outbox)
            if (!db.objectStoreNames.contains(STORES.OUTBOX)) {
                const outboxStore = db.createObjectStore(STORES.OUTBOX, { keyPath: "id" });
                outboxStore.createIndex("status", "status", { unique: false });
            }

            // Store 2: Caché Key-Value genérica (para OSM, respuestas API, etc.)
            if (!db.objectStoreNames.contains(STORES.CACHE)) {
                db.createObjectStore(STORES.CACHE);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

/* ==========================================================================
   OUTBOX OPERATIONS (Sync Offline)
   ========================================================================== */

export const bulkInsertOutbox = async <T>(
    items: T[]
): Promise<PendingSyncItem<T>[]> => {
    const db = await openDB();
    const tx = db.transaction(STORES.OUTBOX, "readwrite");
    const store = tx.objectStore(STORES.OUTBOX);

    const pendingItems: PendingSyncItem<T>[] = items.map((payload) => ({
        id: crypto.randomUUID(),
        payload,
        status: "pending",
        retryCount: 0,
        createdAt: Date.now(),
    }));

    return new Promise((resolve, reject) => {
        pendingItems.forEach((item) => store.add(item));
        tx.oncomplete = () => resolve(pendingItems);
        tx.onerror = () => reject(tx.error);
    });
};

export const getPendingOutboxItems = async <T>(): Promise<PendingSyncItem<T>[]> => {
    const db = await openDB();
    const tx = db.transaction(STORES.OUTBOX, "readonly");
    const store = tx.objectStore(STORES.OUTBOX);

    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as PendingSyncItem<T>[]);
        request.onerror = () => reject(request.error);
    });
};

export const removeFromOutbox = async (id: string): Promise<void> => {
    const db = await openDB();
    const tx = db.transaction(STORES.OUTBOX, "readwrite");
    const store = tx.objectStore(STORES.OUTBOX);

    return new Promise((resolve, reject) => {
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export const updateOutboxItem = async <T>(item: PendingSyncItem<T>): Promise<void> => {
    const db = await openDB();
    const tx = db.transaction(STORES.OUTBOX, "readwrite");
    const store = tx.objectStore(STORES.OUTBOX);

    return new Promise((resolve, reject) => {
        store.put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export async function getStoredData<T>(key: string): Promise<T | null> {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORES.CACHE, "readonly");
            const store = tx.objectStore(STORES.CACHE);
            const request = store.get(key);

            request.onsuccess = () => resolve((request.result as T) ?? null);
            request.onerror = () => resolve(null);
        });
    } catch {
        return null;
    }
}

export async function setStoredData<T>(key: string, value: T): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORES.CACHE, "readwrite");
            const store = tx.objectStore(STORES.CACHE);
            const request = store.put(value, key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch {
    }
}