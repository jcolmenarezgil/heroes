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
                const didSync = await syncProfiles(isOnline, force);
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

    // Keep a stable ref to runSync so the periodic timer doesn't reset when
    // isSyncing / isOnline change.
    const runSyncRef = useRef(runSync);
    useEffect(() => {
        runSyncRef.current = runSync;
    }, [runSync]);

    // Periodic background sync when a non-zero interval is selected.
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

    // Sync when the user navigates back to the home screen. This makes the
    // "real-time" interval feel instant and lets longer intervals refresh as
    // soon as the list is viewed (respecting TTL).
    useEffect(() => {
        const prev = prevPathnameRef.current;
        prevPathnameRef.current = pathname;
        const isHomeNow = pathname === "/" || pathname === `/${locale}`;
        if (isHomeNow && prev !== pathname) {
            void runSync(false);
        }
    }, [pathname, locale, runSync]);

    // Sync when the app/tab regains focus (respects TTL via runSync(false)).
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
        }),
        [interval, setInterval, lastSync, isSyncing, syncNow]
    );

    return (
        <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
    );
}
