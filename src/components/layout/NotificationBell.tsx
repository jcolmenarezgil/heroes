"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { BellIcon } from "@/components/icons";
import { useToast } from "@/components/providers/ToastProvider";
import {
    getNotifications,
    markNotificationsRead,
} from "@/lib/api-client";
import type {
    NotificationDTO,
    NotificationListResponse,
} from "@/lib/notification-mapper";

const POLL_MS = 30_000;
const DROPDOWN_LIMIT = 10;

function notificationText(
    t: ReturnType<typeof useTranslations<"notifications">>,
    n: NotificationDTO
): string {
    const p = n.payload ?? {};
    const profile = p.profileName ?? "";
    switch (n.type) {
        case "suggestion.created":
            return t("type.suggestionCreated", { profile });
        case "suggestion.resolved":
            return t("type.suggestionResolved", {
                profile,
                resolution: t(
                    `type.resolution.${p.resolution ?? "approved"}` as
                        | "type.resolution.approved"
                        | "type.resolution.rejected"
                ),
            });
        case "profile.verified":
            return t("type.profileVerified", { profile });
        case "profile.unverified":
            return t("type.profileUnverified", { profile });
        case "profile.merged":
            return t("type.profileMerged", {
                source: p.sourceProfileName ?? "",
                target: p.targetProfileName ?? "",
            });
        default:
            return profile;
    }
}

export default function NotificationBell() {
    const t = useTranslations("notifications");
    const format = useFormatter();
    const router = useRouter();
    const { status } = useSession();
    const { addToast } = useToast();

    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [items, setItems] = useState<NotificationDTO[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Poll unread count every 30s.
    useEffect(() => {
        if (status !== "authenticated") return;

        let cancelled = false;
        const fetchUnread = () => {
            getNotifications({ limit: 1 })
                .then((res: NotificationListResponse) => {
                    if (!cancelled) setUnreadCount(res.unreadCount);
                })
                .catch(() => {
                    /* silent — badge just stays stale */
                });
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, POLL_MS);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [status]);

    // Load the list when the dropdown opens.
    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        getNotifications({ limit: DROPDOWN_LIMIT })
            .then((res) => {
                if (cancelled) return;
                setItems(res.notifications);
                setUnreadCount(res.unreadCount);
                setIsLoadingList(false);
            })
            .catch(() => {
                if (!cancelled) {
                    addToast(t("loadError"), "error");
                    setIsLoadingList(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [open, addToast, t]);

    // Outside click closes the dropdown (same pattern as UserMenu).
    useEffect(() => {
        if (!open) return;
        const handle = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [open]);

    if (status !== "authenticated") return null;

    const handleItemClick = (n: NotificationDTO) => {
        if (!n.readAt) {
            markNotificationsRead({ ids: [n.id] }).catch(() => {});
            setItems((prev) =>
                prev.map((it) =>
                    it.id === n.id
                        ? { ...it, readAt: new Date().toISOString() }
                        : it
                )
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        }
        setOpen(false);
        const href = n.payload?.href;
        if (typeof href === "string" && href.startsWith("/")) {
            router.push(href as never);
        }
    };

    const handleMarkAll = () => {
        markNotificationsRead({ all: true })
            .then(() => {
                setUnreadCount(0);
                setItems((prev) =>
                    prev.map((it) => ({
                        ...it,
                        readAt: it.readAt ?? new Date().toISOString(),
                    }))
                );
            })
            .catch(() => addToast(t("markReadError"), "error"));
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => {
                    setOpen((v) => {
                        if (!v) setIsLoadingList(true);
                        return !v;
                    });
                }}
                className="relative flex h-8 w-8 items-center justify-center rounded-full text-white focus:outline-none"
                aria-label={t("openMenu")}
                aria-expanded={open}
            >
                <BellIcon className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-neutral-800 bg-neutral-950 p-2 shadow-xl">
                    <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                            {t("title")}
                        </span>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAll}
                                className="text-xs font-medium text-white hover:underline"
                            >
                                {t("markAllRead")}
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 space-y-1 overflow-y-auto">
                        {isLoadingList ? (
                            <p className="py-8 text-center text-sm text-neutral-500">
                                …
                            </p>
                        ) : items.length === 0 ? (
                            <p className="py-8 text-center text-sm text-neutral-500">
                                {t("empty")}
                            </p>
                        ) : (
                            items.map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => handleItemClick(n)}
                                    className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left hover:bg-neutral-900"
                                >
                                    <span
                                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                            n.readAt
                                                ? "bg-transparent"
                                                : "bg-red-500"
                                        }`}
                                        aria-hidden="true"
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm text-white">
                                            {notificationText(t, n)}
                                        </span>
                                        <span className="block text-xs text-neutral-500">
                                            {format.relativeTime(
                                                new Date(n.createdAt),
                                                { now: new Date() }
                                            )}
                                        </span>
                                    </span>
                                </button>
                            ))
                        )}
                    </div>

                    <div className="mt-1 border-t border-neutral-800" />
                    <button
                        onClick={() => {
                            setOpen(false);
                            router.push("/notifications");
                        }}
                        className="block w-full rounded-md px-3 py-2 text-sm text-white hover:bg-neutral-900"
                    >
                        {t("viewAll")}
                    </button>
                </div>
            )}
        </div>
    );
}
