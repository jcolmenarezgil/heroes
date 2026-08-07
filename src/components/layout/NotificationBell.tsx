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
import { getNotificationPollInterval } from "@/lib/notification-prefs";
import type {
    NotificationDTO,
    NotificationListResponse,
    NotificationPayload,
} from "@/lib/notification-mapper";

const DROPDOWN_LIMIT = 10;

function notificationText(
    t: ReturnType<typeof useTranslations<"notifications">>,
    n: NotificationDTO
): string {
    if (!n.payload) return "";

    switch (n.type) {
        case "suggestion.created": {
            const p = n.payload as Extract<
                NotificationPayload,
                { profileName: string; href: string }
            >;
            return t("type.suggestionCreated", { profile: p.profileName });
        }
        case "suggestion.resolved": {
            const p = n.payload as Extract<
                NotificationPayload,
                { profileName: string; resolution: "approved" | "rejected" }
            >;
            return t("type.suggestionResolved", {
                profile: p.profileName,
                resolution: t(
                    `type.resolution.${p.resolution}` as
                        | "type.resolution.approved"
                        | "type.resolution.rejected"
                ),
            });
        }
        case "profile.verified": {
            const p = n.payload as Extract<
                NotificationPayload,
                { profileName: string; href: string }
            >;
            return t("type.profileVerified", { profile: p.profileName });
        }
        case "profile.unverified": {
            const p = n.payload as Extract<
                NotificationPayload,
                { profileName: string; href: string }
            >;
            return t("type.profileUnverified", { profile: p.profileName });
        }
        case "profile.merged": {
            const p = n.payload as Extract<
                NotificationPayload,
                { sourceProfileName: string; targetProfileName: string }
            >;
            return t("type.profileMerged", {
                source: p.sourceProfileName,
                target: p.targetProfileName,
            });
        }
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

    // Poll unread count at the user-configured interval (default 30s).
    // We re-read the interval at the start of each cycle so changes from the
    // sync dropdown's Settings sub-view take effect within one tick.
    useEffect(() => {
        if (status !== "authenticated") return;

        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | null = null;

        const scheduleNext = () => {
            if (cancelled) return;
            const nextDelay = getNotificationPollInterval();
            timer = setTimeout(fetchUnread, nextDelay);
        };

        const fetchUnread = () => {
            if (cancelled) return;
            getNotifications({ limit: 1 })
                .then((res: NotificationListResponse) => {
                    if (!cancelled) setUnreadCount(res.unreadCount);
                })
                .catch(() => {
                    /* silent — badge just stays stale */
                })
                .finally(() => {
                    if (!cancelled) scheduleNext();
                });
        };

        fetchUnread();
        return () => {
            cancelled = true;
            if (timer) clearTimeout(timer);
        };
    }, [status]);

    // Load the unread list when the dropdown opens.
    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        getNotifications({ limit: DROPDOWN_LIMIT, unreadOnly: true })
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
            router.push(href);
        }
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
                        <button
                            onClick={() => {
                                setOpen(false);
                                router.push("/notifications");
                            }}
                            className="rounded-md px-2 py-0.5 text-xs text-white hover:bg-neutral-900"
                        >
                            {t("viewAllHistory")}
                        </button>
                    </div>

                    <div className="max-h-96 space-y-1 overflow-y-auto">
                        {isLoadingList ? (
                            <p className="py-8 text-center text-sm text-neutral-500">
                                …
                            </p>
                        ) : items.length === 0 ? (
                            <p className="py-8 text-center text-sm text-neutral-500">
                                {t("emptyUnread")}
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
                </div>
            )}
        </div>
    );
}
