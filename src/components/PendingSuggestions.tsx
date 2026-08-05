"use client";

import React, { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
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

    if (isLoading) return null;
    if (items.length === 0) return null;

    return (
        <div className="mx-auto mt-8 max-w-3xl space-y-3">
            <h2 className="text-lg font-semibold text-white">
                {t("suggestionPendingCount", { count: items.length })}
            </h2>
            <ul className="space-y-3">
                {items.map((s) => (
                    <li
                        key={s.id}
                        className="rounded-lg border border-neutral-900 bg-neutral-950 p-4"
                    >
                        <p className="text-sm text-neutral-400">
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
                            <p className="mt-1 text-xs text-neutral-500">
                                {s.submitterContact}
                            </p>
                        )}
                        <p className="mt-2 whitespace-pre-wrap text-sm text-white">
                            {s.note}
                        </p>
                        <div className="mt-3 flex gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => resolve(s.id, "approve")}
                                disabled={busyId === s.id}
                            >
                                {t("suggestionApprove")}
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => resolve(s.id, "reject")}
                                disabled={busyId === s.id}
                            >
                                {t("suggestionReject")}
                            </Button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}