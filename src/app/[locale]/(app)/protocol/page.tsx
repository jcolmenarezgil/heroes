import React from "react";
import { useTranslations } from "next-intl";
import { ExclamationTriangleIcon } from "@/components/icons";
import { EmergencyDirectory } from "@/components/protocol/EmergencyDirectory";
import { OfflineChecklist } from "@/components/protocol/OfflineChecklist";
import { ProtocolCommunicationSecurity } from "@/components/protocol/ProtocolCommunicationSecurity";
import { MissingPersonsAccordion } from "@/components/protocol/MissingPersonsAccordion";

export default function ProtocolPage() {
    const t = useTranslations("protocol");
    const missingKeys = ["firstHours", "usingApp", "offlineSupport", "verification"];

    return (
        <main className="mx-auto max-w-4xl px-4 py-8 pb-24 md:pb-12">
            {/* Encabezado */}
            <div className="mb-8 text-center md:text-left">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-500 border border-red-500/20">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    {t("badge")}
                </span>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-4xl">
                    {t("title")}
                </h1>
                <p className="mt-2 text-sm text-neutral-400 md:text-base">
                    {t("subtitle")}
                </p>
            </div>

            <div className="space-y-8">
                {/* Sección 1: Protocolo */}
                <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 md:p-6 shadow-xl">
                    <div className="mb-4 border-b border-neutral-800 pb-3">
                        <h2 className="text-lg font-semibold text-white">
                            {t("missing.title")}
                        </h2>
                        <p className="text-xs text-neutral-400">
                            {t("missing.description")}
                        </p>
                    </div>

                    <MissingPersonsAccordion keys={missingKeys} />
                </section>

                <EmergencyDirectory />
                <OfflineChecklist />
                <ProtocolCommunicationSecurity />
            </div>
        </main>
    );
}