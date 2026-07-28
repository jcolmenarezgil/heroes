"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useFormatter, useTranslations } from "next-intl";
import { useConnectivity } from "@/components/providers/ConnectivityProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { SYNC_INTERVALS } from "@/lib/profiles-cache";

function getInitials(name?: string | null, email?: string | null): string {
    if (name) {
        return name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    }
    if (email) {
        return email.slice(0, 2).toUpperCase();
    }
    return "?";
}

export default function UserMenu() {
    const t = useTranslations();
    const tNav = useTranslations("nav");
    const format = useFormatter();
    const { data: session, status } = useSession();
    const { isOnline } = useConnectivity();
    const { interval, setInterval, lastSync, isSyncing, syncNow } = useSync();
    const { addToast } = useToast();

    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handle = (event: MouseEvent) => {
            if (
                ref.current &&
                !ref.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [open]);

    if (status === "loading") {
        return (
            <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-800" />
        );
    }

    if (!session?.user) {
        return (
            <button
                onClick={() => signIn("google")}
                className="text-sm font-medium text-white hover:text-neutral-300"
            >
                {tNav("signIn")}
            </button>
        );
    }

    const user = session.user;
    const isAdmin = user.role === "admin";

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
        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-neutral-800 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-white"
                aria-label={t("userMenu.openMenu")}
                aria-expanded={open}
            >
                {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={user.image}
                        alt=""
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    getInitials(user.name, user.email)
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-neutral-800 bg-neutral-950 p-2 shadow-xl">
                    {/* User header */}
                    <div className="px-3 py-2">
                        <p className="text-sm font-medium text-white">
                            {user.name || user.email}
                        </p>
                        {user.name && user.email && (
                            <p className="text-xs text-neutral-400">
                                {user.email}
                            </p>
                        )}
                        {user.role && (
                            <span className="mt-1 inline-flex rounded-full bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-300">
                                {t(`admin.roles.${user.role}`)}
                            </span>
                        )}
                    </div>

                    {/* Connectivity status */}
                    <div className="flex items-center gap-2 px-3 py-2">
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
                    <p className="px-3 pb-2 text-xs text-neutral-500">
                        {t("userMenu.lastSync", { time: lastSyncText })}
                    </p>

                    {/* Sync now */}
                    <button
                        onClick={handleSyncNow}
                        disabled={isSyncing || !isOnline}
                        className="mb-2 flex w-full items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500"
                    >
                        {isSyncing ? t("userMenu.syncing") : t("userMenu.syncNow")}
                    </button>

                    {/* Sync interval */}
                    <div className="px-3 py-2">
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

                    <div className="my-1 border-t border-neutral-800" />

                    {/* Actions */}
                    <Link
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            addToast(t("userMenu.comingSoon"), "warning");
                            setOpen(false);
                        }}
                        className="block rounded-md px-3 py-2 text-sm text-white hover:bg-neutral-900"
                    >
                        {t("userMenu.myProfile")}
                    </Link>
                    {isAdmin && (
                        <Link
                            href="/admin"
                            onClick={() => setOpen(false)}
                            className="block rounded-md px-3 py-2 text-sm text-white hover:bg-neutral-900"
                        >
                            {t("userMenu.adminDashboard")}
                        </Link>
                    )}
                    <button
                        onClick={() => signOut()}
                        className="block w-full rounded-md px-3 py-2 text-left text-sm text-white hover:bg-neutral-900"
                    >
                        {tNav("signOut")}
                    </button>
                </div>
            )}
        </div>
    );
}
