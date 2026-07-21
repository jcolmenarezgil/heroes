"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "@/i18n/navigation";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  SearchEmptyIcon,
} from "@/components/icons";
import ProfileCard from "@/components/ui/ProfileCard";
import Skeleton from "@/components/ui/Skeleton";
import { mockProfiles } from "@/lib/mock";
import { normalizeText } from "@/lib/text";

export default function HomePage() {
  const t = useTranslations("home");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isLoading] = useState(false); // placeholder for future fetch

  const results = useMemo(() => {
    const q = normalizeText(query.trim());
    if (!q) return mockProfiles;
    return mockProfiles.filter((profile) =>
      normalizeText(profile.name).includes(q)
    );
  }, [query]);

  return (
    <div className="flex flex-col">
      {/* Title */}
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
        <p className="mt-1 text-sm text-neutral-400">{t("subtitle")}</p>
      </div>

      {/* Search bar */}
      <div className="sticky top-14 z-20 -mx-4 px-4 py-3">
        <div className="relative mx-auto max-w-lg lg:max-w-4xl">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="input-field w-full rounded-lg border border-neutral-700 bg-neutral-900 py-3 pl-12 pr-4 shadow-sm focus:border-white focus:ring-1 focus:ring-white"
          />
        </div>
      </div>

      {/* Results table */}
      <div className="mt-4 overflow-hidden rounded-lg border border-neutral-900">
        {/* Header */}
        <div className="grid grid-cols-[56px_1fr_auto] items-center gap-3 border-b border-neutral-900 bg-neutral-950 px-4 py-2 text-xs font-medium uppercase tracking-wider text-neutral-400">
          <span className="sr-only">{t("photoHeader")}</span>
          <span className="col-span-1">{t("personHeader")}</span>
          <span className="text-right">{t("statusHeader")}</span>
        </div>

        {isLoading ? (
          <div className="space-y-0 divide-y divide-neutral-900">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : results.length > 0 ? (
          <div className="divide-y divide-neutral-900">
            {results.map((profile) => (
              <ProfileCard
                key={profile.id}
                id={profile.id}
                name={profile.name}
                location={profile.lastKnownLocation}
                updatedAt={profile.updatedAt}
                status={profile.status}
                photoUrl={profile.photoUrl}
                onClick={() => router.push(`/p/${profile.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-16 text-center">
            <SearchEmptyIcon className="h-12 w-12 text-neutral-500" aria-hidden="true" />
            <p className="mt-4 text-base font-medium text-white">
              {t("noResults")}
            </p>
            <Link
              href="/create"
              className="mt-2 text-sm font-medium text-white underline underline-offset-4"
            >
              {t("createNew")}
            </Link>
          </div>
        )}
      </div>

      {/* Floating create button */}
      <Link
        href="/create"
        className="fixed bottom-6 right-6 z-50 flex min-h-14 min-w-14 items-center justify-center rounded-full bg-white px-5 py-4 text-xl font-medium text-black shadow-lg shadow-black/50 transition hover:bg-neutral-200 active:scale-[0.98]"
        aria-label={t("create")}
      >
        <PlusIcon className="h-6 w-6" />
      </Link>
    </div>
  );
}
