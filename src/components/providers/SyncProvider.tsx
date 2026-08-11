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
import { useSession } from "next-auth/react";
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
    isOnline: boolean;
    syncNow: () => Promise<void>;
    triggerOutboxSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue>({
    interval: 5 * 60 * 1000,
    setInterval: () => { },
    lastSync: null,
    isSyncing: false,
    isOnline: true,
    syncNow: async () => { },
    triggerOutboxSync: async () => { },
});

export function useSync() {
    return useContext(SyncContext);
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
    const { isOnline } = useConnectivity();
    const { status } = useSession();
    // The cache pull (and outbox flush) is only useful for signed-in users.
    const isAuthed = status === "authenticated";
    const prevOnlineRef = useRef(isOnline);

    const [interval, setIntervalState] = useState(getSyncInterval);
    const [lastSync, setLastSync] = useState<number | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Load lastSync from IndexedDB on mount (client-only).
    useEffect(() => {
        getLastSync().then(setLastSync).catch(() => setLastSync(null));
    }, []);

    const setInterval = useCallback((ms: number) => {
        setSyncInterval(ms);
        setIntervalState(ms);
    }, []);

    // Sync both ways: flush the outbox, then pull fresh data into the cache.
    const runSync = useCallback(
        async (force = false) => {
            if (isSyncing) return;
            if (!isOnline) return;
            if (!isAuthed) return;

            setIsSyncing(true);
            try {
                await processSyncQueue();
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
        [isOnline, isSyncing, isAuthed]
    );

    const syncNow = useCallback(async () => {
        await runSync(true);
    }, [runSync]);

    // Manually flush the outbox queue.
    const triggerOutboxSync = useCallback(async () => {
        if (!isOnline) return;
        if (!isAuthed) return;
        try {
            await processSyncQueue();
        } catch (error) {
            console.error("Outbox sync failed:", error);
        }
    }, [isOnline, isAuthed]);

    // Sync again when the connection comes back.
    useEffect(() => {
        const wasOffline = !prevOnlineRef.current;
        const isNowOnline = isOnline;
        prevOnlineRef.current = isOnline;

        if (isNowOnline && wasOffline) {
            void runSync();
        }
    }, [isOnline, runSync]);

    // Initial sync once the session resolves (authed only). Re-running on the
    // auth transition covers the case where useSession starts as "loading".
    useEffect(() => {
        if (isAuthed) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            void runSync();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthed]);

    // Keep a stable runSync reference for background timers.
    const runSyncRef = useRef(runSync);
    useEffect(() => {
        runSyncRef.current = runSync;
    }, [runSync]);

    // Background periodic sync.
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

    // Sync when returning to the home view.
    useEffect(() => {
        const prev = prevPathnameRef.current;
        prevPathnameRef.current = pathname;
        const isHomeNow = pathname === "/" || pathname === `/${locale}`;
        if (isHomeNow && prev !== pathname) {
            void runSync(false);
        }
    }, [pathname, locale, runSync]);

    // Sync when the tab regains focus.
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
            isOnline,
            syncNow,
            triggerOutboxSync,
        }),
        [interval, setInterval, lastSync, isSyncing, isOnline, syncNow, triggerOutboxSync]
    );

    return (
        <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
    );
}