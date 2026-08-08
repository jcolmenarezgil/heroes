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

const DB_NAME = "EmergencyAppOfflineDB";
const STORE_NAME = "profile_outbox";
const DB_VERSION = 1;

export const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
                store.createIndex("status", "status", { unique: false });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const bulkInsertOutbox = async <T>(
    items: T[]
): Promise<PendingSyncItem<T>[]> => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

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

// Obtener todos los elementos pendientes de sincronizar
export const getPendingOutboxItems = async <T>(): Promise<PendingSyncItem<T>[]> => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as PendingSyncItem<T>[]);
        request.onerror = () => reject(request.error);
    });
};

// Eliminar un elemento de IndexedDB tras sincronizarse con éxito en Neon
export const removeFromOutbox = async (id: string): Promise<void> => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
        const request = store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export const updateOutboxItem = async <T>(item: PendingSyncItem<T>): Promise<void> => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
        const request = store.put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};