"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
    ChatBubbleBottomCenterTextIcon,
    ShieldCheckIcon,
    LockClosedIcon,
} from "@/components/icons";

interface GuidelineItem {
    key: "clarity" | "verification" | "privacy";
    icon: React.ComponentType<{ className?: string }>;
}

const GUIDELINES: GuidelineItem[] = [
    {
        key: "clarity",
        icon: ChatBubbleBottomCenterTextIcon,
    },
    {
        key: "verification",
        icon: ShieldCheckIcon,
    },
    {
        key: "privacy",
        icon: LockClosedIcon,
    },
];

export function ProtocolCommunicationSecurity() {
    const t = useTranslations("protocol.security");

    return (
        <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 shadow-xl">
            <div className="mb-3 border-b border-neutral-800 pb-2">
                <h2 className="text-sm font-semibold text-white">{t("title")}</h2>
            </div>

            <div className="divide-y divide-neutral-800">
                {GUIDELINES.map(({ key, icon: Icon }) => (
                    <div key={key} className="flex items-start gap-2.5 py-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-green-700 text-white">
                            <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-medium text-white">
                                {t(`guidelines.${key}.title`)}
                            </h3>
                            <p className="mt-0.5 text-xs text-neutral-400 leading-relaxed">
                                {t(`guidelines.${key}.description`)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
