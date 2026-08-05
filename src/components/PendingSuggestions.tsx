"use client";

import React, { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/providers/ToastProvider";
import {
    ApiError,
    approveSuggestion,
    listSuggestions,
    rejectSuggestion,
} from "@/lib/api-client";
import type { ProfileSuggestionDTO } from "@/types/profile-suggestion";

interface PendingSuggestionsProps {
    profileId: string;
    onResolved?: () => void;
}

export default function PendingSuggestions({
    profileId,
    onResolved,
}: PendingSuggestionsProps) {
    const t = useTranslations("profile");
    const format = useFormatter();
    const { addToast } = useToast();
    const [items, setItems] = useState<ProfileSuggestionDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = () => {
        listSuggestions(profileId, { status: "pending", limit: 50 })
            .then((res) => setItems(res.suggestions))
            .catch((err) => {
                if (!(err instanceof ApiError && err.status === 403)) {
                    addToast(t("suggestionLoadError"), "error");
                }
            })
            .finally(() => setIsLoading(false));
    };

    useEffect(load, [profileId, addToast, t]);

    const resolve = async (id: string, action: "approve" | "reject") => {
        setBusyId(id);
        try {
            const fn = action === "approve" ? approveSuggestion : rejectSuggestion;
            await fn(profileId, id);
            setItems((prev) => prev.filter((s) => s.id !== id));
            addToast(
                action === "approve" ? t("suggestionApprove") : t("suggestionReject"),
                "success"
            );
            onResolved?.();
        } catch (err) {
            if (err instanceof ApiError && err.status === 403) {
                addToast(t("suggestionResolveError"), "error");
            } else {
                addToast(t("suggestionResolveError"), "error");
            }
        } finally {
            setBusyId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-12 w-full" />
                    <div className="flex gap-2">
                        <Skeleton className="h-7 w-20" />
                        <Skeleton className="h-7 w-20" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <h2 className="text-sm font-semibold text-white">
                {t("suggestionPendingCount", { count: items.length })}
            </h2>
            {items.length === 0 ? (
                <p className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-500">
                    {t("suggestionEmpty")}
                </p>
            ) : (
            <ul className="space-y-2">
                {items.map((s) => (
                    <li
                        key={s.id}
                        className="rounded-lg border border-neutral-800 bg-neutral-950 p-3"
                    >
                        <p className="text-xs text-neutral-400">
                            {t("suggestionBy", {
                                name: s.submitterDisplayName ?? t("suggestionAnon"),
                            })}{" "}
                            ·{" "}
                            {format.dateTime(new Date(s.createdAt), {
                                day: "numeric",
                                month: "short",
                                hour: "numeric",
                                minute: "numeric",
                            })}
                        </p>
                        {s.submitterContact && (
                            <p className="mt-0.5 text-xs text-neutral-500">
                                {s.submitterContact}
                            </p>
                        )}
                        <p className="mt-2 whitespace-pre-wrap text-sm text-white">
                            {s.note}
                        </p>
                        <div className="mt-2 flex gap-2">
                            <Button
                                variant="approve"
                                onClick={() => resolve(s.id, "approve")}
                                disabled={busyId === s.id}
                            >
                                {t("suggestionApprove")}
                            </Button>
                            <Button
                                variant="reject"
                                onClick={() => resolve(s.id, "reject")}
                                disabled={busyId === s.id}
                            >
                                {t("suggestionReject")}
                            </Button>
                        </div>
                    </li>
                ))}
            </ul>
            )}
        </div>
    );
}