"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
    ArrowDownTrayIcon,
    ShareIcon,
    CheckCircleIcon,
    InformationCircleIcon,
} from "@/components/icons";

interface ChecklistItem {
    id: string;
    categoryKey: string;
    itemKey: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
    { id: "item_water", categoryKey: "waterFood", itemKey: "water" },
    { id: "item_cannedFood", categoryKey: "waterFood", itemKey: "cannedFood" },
    { id: "item_firstAid", categoryKey: "medical", itemKey: "firstAid" },
    { id: "item_flashlight", categoryKey: "powerComm", itemKey: "flashlight" },
    { id: "item_powerbank", categoryKey: "powerComm", itemKey: "powerbank" },
    { id: "item_radio", categoryKey: "powerComm", itemKey: "radio" },
    { id: "item_copiesDocs", categoryKey: "docs", itemKey: "copiesDocs" },
    { id: "item_whistle", categoryKey: "docs", itemKey: "whistle" },
];

export function OfflineChecklist() {
    const t = useTranslations("offlineGuide");
    const locale = useLocale();
    const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Carga inicial del caché/almacenamiento local
    useEffect(() => {
        try {
            const saved = localStorage.getItem("heroes_offline_checklist");
            if (saved) {
                setCheckedIds(JSON.parse(saved));
            }
        } catch {
            // Manejo silencioso para entornos restringidos en modo local
        }
    }, []);

    // Persistir en almacenamiento local al modificar
    const toggleItem = (id: string) => {
        const updated = { ...checkedIds, [id]: !checkedIds[id] };
        setCheckedIds(updated);
        try {
            localStorage.setItem("heroes_offline_checklist", JSON.stringify(updated));
        } catch {
            // Fallback seguro si la cuota local falla
        }
    };

    // Exportar progreso a JSON
    const handleExportJSON = () => {
        const payload = {
            exportedAt: new Date().toISOString(),
            locale,
            items: CHECKLIST_ITEMS.map((i) => ({
                id: i.id,
                completed: !!checkedIds[i.id],
                label: t(`items.${i.itemKey}`),
            })),
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `emergency-checklist-${locale}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Compartir por API Nativa o Portapapeles
    const handleShare = async () => {
        const currentUrl = typeof window !== "undefined" ? window.location.href : "";
        const text = t("shareTemplate", { url: currentUrl });

        if (navigator.share) {
            try {
                await navigator.share({
                    title: t("title"),
                    text,
                    url: currentUrl,
                });
                return;
            } catch {
                // Ignorar si el usuario cancela la ventana nativa
            }
        }

        // Copiar al portapapeles como fallback
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            setToastMessage(t("copySuccess"));
            setTimeout(() => setToastMessage(null), 3000);
        }
    };

    const categories = Array.from(
        new Set(CHECKLIST_ITEMS.map((item) => item.categoryKey))
    );

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
            {/* Encabezado */}
            <div className="mb-6">
                <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-300 rounded-full mb-2">
                    {t("badge")}
                </span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t("title")}
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {t("subtitle")}
                </p>
            </div>

            {/* Nota sobre Almacenamiento Local */}
            <div className="flex items-start gap-3 p-3.5 mb-6 text-sm bg-slate-50 dark:bg-slate-800/60 rounded-lg text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                <InformationCircleIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p>{t("storageNotice")}</p>
            </div>

            {/* Acciones Rápidas */}
            <div className="flex flex-wrap gap-3 mb-8">
                <button
                    onClick={handleExportJSON}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    {t("exportJson")}
                </button>
                <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                    <ShareIcon className="w-4 h-4" />
                    {t("shareMessage")}
                </button>
            </div>

            {/* Checklist Categorizado */}
            <div className="space-y-6">
                {categories.map((catKey) => (
                    <div key={catKey} className="border-t border-gray-100 dark:border-gray-800 pt-4">
                        <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">
                            {t(`categories.${catKey}`)}
                        </h3>
                        <div className="space-y-2.5">
                            {CHECKLIST_ITEMS.filter((i) => i.categoryKey === catKey).map(
                                (item) => {
                                    const isChecked = !!checkedIds[item.id];
                                    return (
                                        <label
                                            key={item.id}
                                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isChecked
                                                    ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900/40"
                                                    : "bg-gray-50/50 dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-700/60 hover:bg-gray-100/50"
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => toggleItem(item.id)}
                                                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span
                                                className={`text-sm ${isChecked
                                                        ? "line-through text-gray-500 dark:text-gray-400"
                                                        : "text-gray-800 dark:text-gray-200"
                                                    }`}
                                            >
                                                {t(`items.${item.itemKey}`)}
                                            </span>
                                        </label>
                                    );
                                }
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Toast Feedback */}
            {toastMessage && (
                <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium animate-fade-in">
                    <CheckCircleIcon className="w-4 h-4 text-green-400 dark:text-green-600" />
                    {toastMessage}
                </div>
            )}
        </div>
    );
}