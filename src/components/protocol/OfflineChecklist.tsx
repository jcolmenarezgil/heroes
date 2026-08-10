"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowDownTrayIcon } from "@/components/icons";

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

    // Carga inicial del caché/almacenamiento local. Client-only read: lazy state
    // init would break SSR hydration, so this sync-from-external-store effect is intentional.
    useEffect(() => {
        try {
            const saved = localStorage.getItem("heroes_offline_checklist");
            if (saved) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
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

    const categories = Array.from(
        new Set(CHECKLIST_ITEMS.map((item) => item.categoryKey))
    );

    return (
        <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 shadow-xl">
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-neutral-800 pb-2">
                <h2 className="text-sm font-semibold text-white">{t("title")}</h2>
                <button
                    onClick={handleExportJSON}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-[11px] font-medium text-neutral-200 transition-colors hover:bg-neutral-800"
                >
                    <ArrowDownTrayIcon className="h-3 w-3" />
                    {t("exportJson")}
                </button>
            </div>

            <div className="space-y-4">
                {categories.map((catKey) => (
                    <div key={catKey}>
                        <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                            {t(`categories.${catKey}`)}
                        </h3>
                        {CHECKLIST_ITEMS.filter((i) => i.categoryKey === catKey).map(
                            (item) => {
                                const isChecked = !!checkedIds[item.id];
                                return (
                                    <label
                                        key={item.id}
                                        className="flex cursor-pointer items-center gap-2.5 py-2"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleItem(item.id)}
                                            className="h-4 w-4 shrink-0 rounded border-neutral-700 bg-neutral-900 accent-emerald-500"
                                        />
                                        <span
                                            className={`text-sm ${isChecked
                                                    ? "line-through text-neutral-500"
                                                    : "text-neutral-200"
                                                }`}
                                        >
                                            {t(`items.${item.itemKey}`)}
                                        </span>
                                    </label>
                                );
                            }
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
