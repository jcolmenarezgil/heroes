"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export default function LanguageSwitcher() {
  const t = useTranslations("languageSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = event.target.value;
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <span className="sr-only">{t("label")}</span>
      <select
        value={locale}
        onChange={handleChange}
        aria-label={t("label")}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="en">{t("english")}</option>
        <option value="es">{t("spanish")}</option>
      </select>
    </label>
  );
}
