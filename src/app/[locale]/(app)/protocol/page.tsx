import React from "react";
import { useTranslations } from "next-intl";
import { ExclamationTriangleIcon } from "@/components/icons";
import { EmergencyDirectory } from "@/components/protocol/EmergencyDirectory";
import { OfflineChecklist } from "@/components/protocol/OfflineChecklist";
import { ProtocolCommunicationSecurity } from "@/components/protocol/ProtocolCommunicationSecurity";
import { MissingPersonsAccordion } from "@/components/protocol/MissingPersonsAccordion";

const NAV_SECTIONS = [
  { id: "missing", labelKey: "sections.missing" },
  { id: "emergency", labelKey: "sections.emergencyNumbers" },
  { id: "offline", labelKey: "sections.offlineKit" },
  { id: "security", labelKey: "sections.security" },
];

export default function ProtocolPage() {
  const t = useTranslations("protocol");
  const missingKeys = ["firstHours", "usingApp"];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24 md:pb-12">
      <header className="mb-6 text-center md:mb-8 md:text-left">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
          <ExclamationTriangleIcon className="h-4 w-4" />
          {t("badge")}
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-neutral-400 md:text-base">
          {t("subtitle")}
        </p>
      </header>

      <nav
        className="flex gap-2 overflow-x-auto border-b border-neutral-800 pb-3 lg:hidden"
        aria-label={t("sections.label")}
      >
        {NAV_SECTIONS.map(({ id, labelKey }) => (
          <a
            key={id}
            href={`#${id}`}
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
          >
            {t(labelKey)}
          </a>
        ))}
      </nav>

      <div className="mt-6 grid gap-5 lg:grid-cols-5 lg:items-start">
        <section
          id="missing"
          className="scroll-mt-24 rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 shadow-xl lg:order-1 lg:col-span-3"
        >
          <div className="mb-3 border-b border-neutral-800 pb-2">
            <h2 className="text-lg font-semibold text-white">
              {t("missing.title")}
            </h2>
          </div>

          <MissingPersonsAccordion keys={missingKeys} />
        </section>

        <div id="emergency" className="scroll-mt-24 lg:order-2 lg:col-span-2">
          <EmergencyDirectory />
        </div>

        <div id="offline" className="scroll-mt-24 lg:order-3 lg:col-span-3">
          <OfflineChecklist />
        </div>

        <div id="security" className="scroll-mt-24 lg:order-4 lg:col-span-2">
          <ProtocolCommunicationSecurity />
        </div>
      </div>
    </div>
  );
}
