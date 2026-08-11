"use client";

import React, { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { profileSchema } from "@/lib/validations/profile";
import { bulkInsertOutbox } from "@/lib/db/indexedDB";
import { useSync } from "@/components/providers/SyncProvider";

type ProfileInput = z.infer<typeof profileSchema>;

interface ProfileJsonImporterProps {
    onSuccess?: () => void;
}

// Normalize fields exported from raw SQL/Neon to match the Zod types.
function normalizeRawDbItem(item: Record<string, unknown>): Record<string, unknown> {
    const sanitizeDate = (val: unknown) =>
        typeof val === "string" ? val.replace(" ", "T") : val;

    return {
        ...item,
        // Convert SQL timestamps to ISO-8601 for Zod.
        created_at: item.created_at ? sanitizeDate(item.created_at) : undefined,
        updated_at: item.updated_at ? sanitizeDate(item.updated_at) : undefined,
        // Convert null to undefined for optional() fields.
        photo_url: item.photo_url ?? undefined,
        photo_path: item.photo_path ?? undefined,
        verified: item.verified ?? undefined,
        notes: item.notes ?? undefined,
    };
}

export default function ProfileJsonImporter({ onSuccess }: ProfileJsonImporterProps) {
    const t = useTranslations("admin.profiles");
    const { addToast } = useToast();
    const { triggerOutboxSync } = useSync();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const processImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const parsedData = JSON.parse(text);

                const rawItems = Array.isArray(parsedData) ? parsedData : [parsedData];

                if (rawItems.length === 0) {
                    addToast(t("importInvalidFormat"), "error");
                    setIsProcessing(false);
                    return;
                }

                const validatedItems: ProfileInput[] = [];

                for (const rawItem of rawItems) {
                    const normalized = normalizeRawDbItem(rawItem as Record<string, unknown>);
                    const validation = profileSchema.safeParse(normalized);

                    if (!validation.success) {
                        console.error("Zod Validation Error Details:", validation.error.format());
                        addToast(t("importInvalidFormat"), "error");
                        setIsProcessing(false);
                        return;
                    }

                    validatedItems.push(validation.data);
                }

                await bulkInsertOutbox(validatedItems);

                addToast(t("importQueued", { count: validatedItems.length }), "success");
                if (onSuccess) onSuccess();

                await triggerOutboxSync();
            } catch {
                addToast(t("importError"), "error");
            } finally {
                setIsProcessing(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        };

        reader.onerror = () => {
            addToast(t("importError"), "error");
            setIsProcessing(false);
        };

        reader.readAsText(file);
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={processImport}
                accept=".json,application/json"
                className="hidden"
                aria-hidden="true"
            />
            <Button
                variant="secondary"
                onClick={handleButtonClick}
                isLoading={isProcessing}
                disabled={isProcessing}
                className="text-xs"
            >
                {t("importJson")}
            </Button>
        </>
    );
}