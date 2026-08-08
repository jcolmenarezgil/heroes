// src/components/providers/SyncProvider.tsx

"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { useConnectivity } from "@/components/providers/ConnectivityProvider";
import {
    getLastSync,
    getSyncInterval,
    setSyncInterval,
    syncProfiles,
} from "@/lib/profiles-cache";
import { processSyncQueue } from "@/lib/sync/syncService";

interface SyncContextValue {
    interval: number;
    setInterval: (ms: number) => void;
    lastSync: number | null;
    isSyncing: boolean;
    syncNow: () => Promise<void>;
    triggerOutboxSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue>({
    interval: 5 * 60 * 1000,
    setInterval: () => { },
    lastSync: null,
    isSyncing: false,
    syncNow: async () => { },
    triggerOutboxSync: async () => { },
});

export function useSync() {
    return useContext(SyncContext);
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
    const { isOnline } = useConnectivity();
    const prevOnlineRef = useRef(isOnline);

    const [interval, setIntervalState] = useState(getSyncInterval);
    const [lastSync, setLastSync] = useState<number | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Hydrate lastSync from IndexedDB on mount (client-only).
    useEffect(() => {
        getLastSync().then(setLastSync).catch(() => setLastSync(null));
    }, []);

    const setInterval = useCallback((ms: number) => {
        setSyncInterval(ms);
        setIntervalState(ms);
    }, []);

    // Ejecuta la sincronización bidireccional (Outbox + Pull Cache)
    const runSync = useCallback(
        async (force = false) => {
            if (isSyncing) return;
            if (!isOnline) return;

            setIsSyncing(true);
            try {
                // 1. Flush de datos locales pendientes hacia el servidor
                await processSyncQueue();

                // 2. Traer datos frescos del servidor a la caché local
                const didSync = await syncProfiles(isOnline, force);
                if (didSync || force) {
                    const updated = await getLastSync();
                    setLastSync(updated);
                }
            } catch (error) {
                console.error("Sync process error:", error);
            } finally {
                setIsSyncing(false);
            }
        },
        [isOnline, isSyncing]
    );

    const syncNow = useCallback(async () => {
        await runSync(true);
    }, [runSync]);

    // Disparador dedicado exclusivamente a vaciar la cola outbox de forma manual
    const triggerOutboxSync = useCallback(async () => {
        if (!isOnline) return;
        try {
            await processSyncQueue();
        } catch (error) {
            console.error("Outbox sync failed:", error);
        }
    }, [isOnline]);

    // Auto-sync cuando la conexión se restablece.
    useEffect(() => {
        const wasOffline = !prevOnlineRef.current;
        const isNowOnline = isOnline;
        prevOnlineRef.current = isOnline;

        if (isNowOnline && wasOffline) {
            void runSync();
        }
    }, [isOnline, runSync]);

    // Initial sync on mount (runs once, only if online).
    useEffect(() => {
        if (isOnline) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            void runSync();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Mantener referencia estable de runSync para temporizadores de fondo
    const runSyncRef = useRef(runSync);
    useEffect(() => {
        runSyncRef.current = runSync;
    }, [runSync]);

    // Background periodic sync
    useEffect(() => {
        if (interval <= 0) return;
        const timer = window.setInterval(() => {
            void runSyncRef.current(false);
        }, interval);
        return () => window.clearInterval(timer);
    }, [interval]);

    const pathname = usePathname();
    const locale = useLocale();
    const prevPathnameRef = useRef(pathname);

    // Sync al regresar a la vista principal
    useEffect(() => {
        const prev = prevPathnameRef.current;
        prevPathnameRef.current = pathname;
        const isHomeNow = pathname === "/" || pathname === `/${locale}`;
        if (isHomeNow && prev !== pathname) {
            void runSync(false);
        }
    }, [pathname, locale, runSync]);

    // Sync cuando la pestaña o aplicación recupera el foco
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                void runSyncRef.current(false);
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () =>
            document.removeEventListener("visibilitychange", handleVisibility);
    }, []);

    const value = useMemo(
        () => ({
            interval,
            setInterval,
            lastSync,
            isSyncing,
            syncNow,
            triggerOutboxSync,
        }),
        [interval, setInterval, lastSync, isSyncing, syncNow, triggerOutboxSync]
    );

    return (
        <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
    );
}