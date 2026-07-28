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
import { useConnectivity } from "@/components/providers/ConnectivityProvider";
import {
    getLastSync,
    getSyncInterval,
    setSyncInterval,
    syncProfiles,
} from "@/lib/profiles-cache";

interface SyncContextValue {
    interval: number;
    setInterval: (ms: number) => void;
    lastSync: number | null;
    isSyncing: boolean;
    syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue>({
    interval: 5 * 60 * 1000,
    setInterval: () => {},
    lastSync: null,
    isSyncing: false,
    syncNow: async () => {},
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

    const runSync = useCallback(
        async (force = false) => {
            if (isSyncing) return;
            if (!isOnline) return;

            setIsSyncing(true);
            try {
                const didSync = await syncProfiles(true);
                if (didSync || force) {
                    const updated = await getLastSync();
                    setLastSync(updated);
                }
            } catch (error) {
                console.error("Sync failed:", error);
            } finally {
                setIsSyncing(false);
            }
        },
        [isOnline, isSyncing]
    );

    const syncNow = useCallback(async () => {
        await runSync(true);
    }, [runSync]);

    // Auto-sync on mount and when connection comes back online.
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

    const value = useMemo(
        () => ({
            interval,
            setInterval,
            lastSync,
            isSyncing,
            syncNow,
        }),
        [interval, setInterval, lastSync, isSyncing, syncNow]
    );

    return (
        <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
    );
}
