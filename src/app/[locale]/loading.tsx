import React from "react";
import { getTranslations } from "next-intl/server";
import Skeleton from "@/components/ui/Skeleton";

export default async function Loading() {
  const t = await getTranslations("common");
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <p className="sr-only">{t("loading")}</p>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  );
}