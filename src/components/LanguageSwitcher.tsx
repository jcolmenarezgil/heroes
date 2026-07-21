"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { GlobeIcon } from "@/components/icons";

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
    <div className="flex items-center gap-1 text-white">
      <GlobeIcon className="h-5 w-5" />
      <label className="sr-only" htmlFor="language-switcher">
        {t("label")}
      </label>
      <select
        id="language-switcher"
        value={locale}
        onChange={handleChange}
        aria-label={t("label")}
        className="bg-transparent text-sm font-medium focus:outline-none"
      >
        <option value="en" className="bg-black text-white">
          EN
        </option>
        <option value="es" className="bg-black text-white">
          ES
        </option>
      </select>
    </div>
  );
}
