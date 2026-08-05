"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useFormatter, useTranslations } from "next-intl";
import Skeleton from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { SearchEmptyIcon } from "@/components/icons";
import { useRouter } from "@/i18n/navigation";
import {
    getNotifications,
    markNotificationsRead,
    type ListNotificationsParams,
} from "@/lib/api-client";
import type { NotificationDTO } from "@/lib/notification-mapper";

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

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            router.push("/login");
        }
    }, [sessionStatus, router]);

    useEffect(() => {
        if (sessionStatus !== "authenticated") return;
        let cancelled = false;

        const params: ListNotificationsParams = { page, limit: 20 };
        if (unreadOnly) params.unreadOnly = true;

        getNotifications(params)
            .then((res) => {
                if (cancelled) return;
                setItems(res.notifications);
                setUnreadCount(res.unreadCount);
                setTotalPages(res.totalPages);
                setIsLoading(false);
            })
            .catch(() => {
                if (!cancelled) {
                    addToast(t("loadError"), "error");
                    setIsLoading(false);
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

    if (sessionStatus === "loading") {
        return null;
    }

    return (
        <div className="mx-auto max-w-lg lg:max-w-4xl">
            {/* Title */}
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-white">
                        {t("title")}
                    </h1>
                    <p className="mt-1 text-sm text-neutral-400">
                        {t("subtitle")}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="secondary" onClick={handleMarkAll}>
                        {t("markAllRead")}
                    </Button>
                )}
            </div>

            {/* Filter toggle */}
            <div className="mb-4 flex items-center gap-2">
                <button
                    onClick={() => {
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
            </div>

            {/* List */}
            <div className="overflow-hidden rounded-lg border border-neutral-900">
                {isLoading ? (
                    <div className="divide-y divide-neutral-900">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
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
                                    <span className="block text-sm text-white">
                                        {notificationText(t, n)}
                                    </span>
                                    {n.payload?.noteExcerpt && (
                                        <span className="mt-0.5 block truncate text-xs text-neutral-400">
                                            {n.payload.noteExcerpt}
                                        </span>
                                    )}
                                    <span className="mt-0.5 block text-xs text-neutral-500">
                                        {format.relativeTime(
                                            new Date(n.createdAt),
                                            { now: new Date() }
                                        )}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <Button
                        variant="secondary"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                    >
                        {t("prevPage")}
                    </Button>
                    <span className="text-sm text-neutral-400">
                        {t("page", { page, totalPages })}
                    </span>
                    <Button
                        variant="secondary"
                        onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page >= totalPages}
                    >
                        {t("nextPage")}
                    </Button>
                </div>
            )}
        </div>
    );
}
