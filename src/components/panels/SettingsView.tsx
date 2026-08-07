"use client";

import React, { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useConnectivity } from "@/components/providers/ConnectivityProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { SYNC_INTERVALS } from "@/lib/profiles-cache";
import {
    NOTIFICATION_POLL_INTERVALS,
    getNotificationPollInterval,
    setNotificationPollInterval,
} from "@/lib/notification-prefs";

/**
 * Shared sub-view for client-side settings: online status, last sync, sync
 * now, sync interval, and notification poll interval. Rendered as the
 * "Settings" sub-view inside the user menu's dropdown.
 */
export default function SettingsView() {
    const t = useTranslations();
    const format = useFormatter();
    const { isOnline } = useConnectivity();
    const { interval, setInterval, lastSync, isSyncing, syncNow } = useSync();
    const { addToast } = useToast();

    const [pollInterval, setPollIntervalState] = useState<number>(
        getNotificationPollInterval
    );

    const lastSyncText = lastSync
        ? format.relativeTime(new Date(lastSync), { now: new Date() })
        : t("userMenu.neverSynced");

    const handleSyncNow = async () => {
        if (!isOnline) {
            addToast(t("userMenu.offlineSync"), "warning");
            return;
        }
        await syncNow();
    };

    const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setInterval(Number(e.target.value));
    };

    const handlePollIntervalChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const next = Number(e.target.value);
        setPollIntervalState(next);
        setNotificationPollInterval(next);
    };

    return (
        <div className="space-y-2">
            {/* Online status */}
            <div className="flex items-center gap-2 px-3 py-1">
                <span
                    className={`h-2 w-2 rounded-full ${
                        isOnline ? "bg-green-500" : "bg-yellow-500"
                    }`}
                />
                <span className="text-sm text-neutral-300">
                    {isOnline
                        ? t("connectivity.online")
                        : t("connectivity.offline")}
                </span>
            </div>

            {/* Last sync */}
            <p className="px-3 pb-1 text-xs text-neutral-500">
                {t("userMenu.lastSync", { time: lastSyncText })}
            </p>

            {/* Sync now */}
            <button
                onClick={handleSyncNow}
                disabled={isSyncing || !isOnline}
                className="flex w-full items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500"
            >
                {isSyncing ? t("userMenu.syncing") : t("userMenu.syncNow")}
            </button>

            {/* Sync interval */}
            <div className="px-3 py-1">
                <label
                    htmlFor="sync-interval"
                    className="mb-1 block text-xs text-neutral-400"
                >
                    {t("userMenu.syncInterval")}
                </label>
                <select
                    id="sync-interval"
                    value={interval}
                    onChange={handleIntervalChange}
                    className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white focus:border-white focus:outline-none"
                >
                    {SYNC_INTERVALS.map((item) => (
                        <option key={item.value} value={item.value}>
                            {t(item.labelKey)}
                        </option>
                    ))}
                </select>
            </div>

            {/* Notification poll interval */}
            <div className="px-3 py-1">
                <label
                    htmlFor="notif-interval"
                    className="mb-1 block text-xs text-neutral-400"
                >
                    {t("userMenu.notifInterval")}
                </label>
                <select
                    id="notif-interval"
                    value={pollInterval}
                    onChange={handlePollIntervalChange}
                    className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white focus:border-white focus:outline-none"
                >
                    {NOTIFICATION_POLL_INTERVALS.map((item) => (
                        <option key={item.value} value={item.value}>
                            {t(item.labelKey)}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
