"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDownIcon } from "@/components/icons";

interface MissingPersonsAccordionProps {
    keys: string[];
}

export function MissingPersonsAccordion({ keys }: MissingPersonsAccordionProps) {
    const t = useTranslations("protocol");
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({
        firstHours: true,
    });

    const toggleItem = (key: string) => {
        setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="divide-y divide-neutral-800">
            {keys.map((key) => {
                const isOpen = !!openItems[key];
                return (
                    <div key={key} className="border-b border-neutral-800 last:border-b-0">
                        <button
                            type="button"
                            onClick={() => toggleItem(key)}
                            className="flex w-full items-center justify-between py-4 text-left font-medium text-white transition-colors hover:text-neutral-300 focus:outline-none"
                            aria-expanded={isOpen}
                        >
                            <span className="text-sm md:text-base">
                                {t(`missing.items.${key}.title`)}
                            </span>
                            <ChevronDownIcon
                                className={`h-5 w-5 text-neutral-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-red-500" : ""
                                    }`}
                            />
                        </button>
                        {isOpen && (
                            <div className="pb-4 text-xs md:text-sm text-neutral-400 leading-relaxed">
                                {t(`missing.items.${key}.content`)}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}