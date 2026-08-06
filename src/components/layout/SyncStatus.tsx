"use client";

import React from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useConnectivity } from "@/components/providers/ConnectivityProvider";
import { useSync } from "@/components/providers/SyncProvider";

/**
 * Click-through trigger that opens the user menu's settings sub-view.
 *
 * The pill itself only renders the status indicator (online dot + last sync).
 * Clicking it dispatches a `user-menu:open` CustomEvent on `window`, which
 * `UserMenu` listens for and responds by opening with the requested view.
 * This keeps a single owner of the dropdown panel.
 */
export default function SyncStatus() {
    const t = useTranslations();
    const format = useFormatter();
    const { isOnline } = useConnectivity();
    const { lastSync } = useSync();

    const lastSyncText = lastSync
        ? format.relativeTime(new Date(lastSync), { now: new Date() })
        : t("userMenu.neverSynced");

    const ariaLabel = `${isOnline ? t("connectivity.online") : t("connectivity.offline")} — ${t("userMenu.lastSync", { time: lastSyncText })}`;

    return (
        <button
            onClick={() => {
                window.dispatchEvent(
                    new CustomEvent("user-menu:open", {
                        detail: { view: "settings" },
                    })
                );
            }}
            className="flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900/50 px-2.5 py-1 text-xs text-neutral-400 focus:outline-none focus:ring-2 focus:ring-white"
            title={ariaLabel}
            aria-label={ariaLabel}
        >
            <span
                className={`h-2 w-2 rounded-full ${
                    isOnline ? "bg-green-500" : "bg-yellow-500"
                }`}
            />
            <span className="hidden sm:inline">
                {isOnline ? t("syncStatus.online") : t("syncStatus.offline")}
            </span>
            <span className="hidden text-neutral-600 md:inline">·</span>
            <span className="hidden md:inline">
                {t("userMenu.lastSync", { time: lastSyncText })}
            </span>
        </button>
    );
}
