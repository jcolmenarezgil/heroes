"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-center text-white">
      <h1 className="text-2xl font-semibold">{t("errorTitle")}</h1>
      <p className="mt-2 max-w-md text-sm text-neutral-400">
        {t("errorDescription")}
      </p>
      <div className="mt-6">
        <Button onClick={reset}>{t("retry")}</Button>
      </div>
    </div>
  );
}