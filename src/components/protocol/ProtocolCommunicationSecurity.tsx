"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
    ChatBubbleBottomCenterTextIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    LockClosedIcon,
    CheckCircleIcon,
} from "@/components/icons";

interface GuidelineItem {
    key: "clarity" | "verification" | "privacy" | "responsibility";
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
    {
        key: "responsibility",
        icon: ExclamationTriangleIcon,
    },
];

export function ProtocolCommunicationSecurity() {
    const t = useTranslations("protocol.security");

    return (
        <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 md:p-6 shadow-xl">
            {/* Encabezado de la Sección */}
            <div className="mb-6 border-b border-neutral-800 pb-4">
                <span className="inline-block px-3 py-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-3">
                    {t("badge")}
                </span>
                <h2 className="text-xl font-bold text-white md:text-2xl tracking-tight">
                    {t("title")}
                </h2>
                <p className="mt-1.5 text-xs md:text-sm text-neutral-400 leading-relaxed">
                    {t("subtitle")}
                </p>
            </div>

            {/* Cuadrícula de Lineamientos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {GUIDELINES.map(({ key, icon: Icon }) => (
                    <div
                        key={key}
                        className="flex items-start gap-3.5 p-4 rounded-lg bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 transition-colors"
                    >
                        <div className="p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                            <Icon className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">
                                {t(`guidelines.${key}.title`)}
                            </h3>
                            <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
                                {t(`guidelines.${key}.description`)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Banner de Compromiso y Madurez */}
            <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                <div className="flex items-start gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-xs md:text-sm font-semibold text-emerald-300">
                            {t("callToAction.title")}
                        </h4>
                        <p className="mt-1 text-xs text-neutral-300 leading-relaxed">
                            {t("callToAction.description")}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}