"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useFormatter, useTranslations } from "next-intl";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/providers/ToastProvider";
import { SearchEmptyIcon } from "@/components/icons";
import { useRouter } from "@/i18n/navigation";
import {
    getNotifications,
    markNotificationsRead,
    type ListNotificationsParams,
} from "@/lib/api-client";
import type { NotificationDTO, NotificationPayload } from "@/lib/notification-mapper";

const PAGE_LIMIT = 10;
const SKELETON_ROWS = [0, 1, 2];

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

function SkeletonRows() {
    return (
        <>
            {SKELETON_ROWS.map((i) => (
                <div
                    key={i}
                    className="flex items-start gap-3 px-4 py-3"
                    aria-hidden="true"
                >
                    <Skeleton className="mt-1.5 h-2 w-2 rounded-full" />
                    <div className="min-w-0 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="mt-1.5 h-3 w-1/3" />
                    </div>
                </div>
            ))}
        </>
    );
}

export default function NotificationsPage() {
    const t = useTranslations("notifications");
    const format = useFormatter();
    const router = useRouter();
    const { status: sessionStatus } = useSession();
    const { addToast } = useToast();

    const [items, setItems] = useState<NotificationDTO[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            router.push("/login");
        }
    }, [sessionStatus, router]);

    // Fetch the current page whenever page or filter changes.
    useEffect(() => {
        if (sessionStatus !== "authenticated") return;
        let cancelled = false;

        const params: ListNotificationsParams = { page, limit: PAGE_LIMIT };
        if (unreadOnly) params.unreadOnly = true;
        const isFirstLoad = page === 1;

        getNotifications(params)
            .then((res) => {
                if (cancelled) return;
                setItems((prev) => {
                    if (isFirstLoad) return res.notifications;
                    // Append, dedupe by id (defensive against duplicates).
                    const seen = new Set(prev.map((p) => p.id));
                    return [
                        ...prev,
                        ...res.notifications.filter((n) => !seen.has(n.id)),
                    ];
                });
                if (isFirstLoad) setUnreadCount(res.unreadCount);
                setTotalPages(res.totalPages);
                setIsLoading(false);
                setIsLoadingMore(false);
            })
            .catch(() => {
                if (!cancelled) {
                    addToast(t("loadError"), "error");
                    setIsLoading(false);
                    setIsLoadingMore(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [sessionStatus, page, unreadOnly, addToast, t]);

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
        const href = n.payload?.href;
        if (typeof href === "string" && href.startsWith("/")) {
            router.push(href);
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

    const handleLoadMore = () => {
        if (isLoadingMore || page >= totalPages) return;
        setIsLoadingMore(true);
        setPage((p) => p + 1);
    };

    const hasMore = page < totalPages;

    if (sessionStatus === "loading") {
        return null;
    }

    return (
        <div className="mx-auto max-w-lg lg:max-w-4xl">
            {/* Title */}
            <div className="mb-4">
                <h1 className="text-2xl font-semibold text-white">
                    {t("title")}
                </h1>
                <p className="mt-1 text-sm text-neutral-400">
                    {t("subtitle")}
                </p>
            </div>

            {/* Filter toggle */}
            <div className="mb-4 flex items-center gap-2">
                <button
                    onClick={() => {
                        setIsLoading(true);
                        setUnreadOnly((v) => !v);
                        setPage(1);
                    }}
                    className={`rounded-md border px-2 py-1 text-xs transition ${
                        unreadOnly
                            ? "border-white bg-white text-black"
                            : "border-neutral-700 text-white hover:bg-neutral-900"
                    }`}
                >
                    {t("unreadOnly")}
                </button>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAll}
                        className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-white transition hover:bg-neutral-900"
                    >
                        {t("markAllRead")}
                    </button>
                )}
            </div>

            {/* List */}
            <div className="overflow-hidden rounded-lg border border-neutral-900">
                {isLoading ? (
                    <div className="divide-y divide-neutral-900">
                        <SkeletonRows />
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                        <SearchEmptyIcon
                            className="h-12 w-12 text-neutral-500"
                            aria-hidden="true"
                        />
                        <p className="mt-4 text-base font-medium text-white">
                            {t("empty")}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-900">
                        {items.map((n) => (
                            <button
                                key={n.id}
                                onClick={() => handleItemClick(n)}
                                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-neutral-950 ${
                                    n.readAt ? "" : "bg-neutral-950/60"
                                }`}
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
                                    <span
                                        className={`block text-sm ${
                                            n.readAt
                                                ? "text-neutral-400"
                                                : "text-white"
                                        }`}
                                    >
                                        {notificationText(t, n)}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-neutral-500">
                                        {format.relativeTime(
                                            new Date(n.createdAt),
                                            { now: new Date() }
                                        )}
                                    </span>
                                </span>
                            </button>
                        ))}
                        {isLoadingMore && <SkeletonRows />}
                    </div>
                )}
            </div>

            {/* Load more */}
            {!isLoading && items.length > 0 && hasMore && !isLoadingMore && (
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={handleLoadMore}
                        className="rounded-md border border-neutral-700 px-3 py-1 text-xs text-white transition hover:bg-neutral-900"
                    >
                        {t("loadMore")}
                    </button>
                </div>
            )}
        </div>
    );
}
