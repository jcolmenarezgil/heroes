"use client";

import React, { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "@/i18n/navigation";
import {
  MagnifyingGlassIcon,
  SearchEmptyIcon,
} from "@/components/icons";
import ProfileCard from "@/components/ui/ProfileCard";
import Skeleton from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import FabCreate from "@/components/ui/FabCreate";
import { useToast } from "@/components/providers/ToastProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { searchCachedProfiles } from "@/lib/profiles-cache";
import type { ProfileDTO } from "@/types/profile";

const PAGE_SIZE = 20;

export default function HomePage() {
  const t = useTranslations("home");
  const format = useFormatter();
  const router = useRouter();
  const { addToast } = useToast();
  const { lastSync } = useSync();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileDTO[]>([]);

  // debounce search input ~300ms
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  // Read from IndexedDB first; the SyncProvider handles background server sync.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const cached = await searchCachedProfiles(debouncedQuery);
        if (!cancelled) setProfiles(cached);
      } catch {
        if (!cancelled) addToast(t("loadError"), "error");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, lastSync, addToast, t]);

  const totalPages = Math.ceil(profiles.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const results = profiles.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

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
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : results.length > 0 ? (
          <div className="divide-y divide-neutral-900">
            {results.map((profile) => (
              <ProfileCard
                key={profile.id}
                id={profile.id}
                name={profile.name}
                location={profile.lastKnownLocation}
                status={profile.status}
                createdByName={profile.createdByName}
                updatedByName={profile.updatedByName}
                createdAt={format.dateTime(new Date(profile.createdAt), {
                  day: "numeric",
                  month: "short",
                })}
                updatedAt={format.dateTime(new Date(profile.updatedAt), {
                  day: "numeric",
                  month: "short",
                })}
                photoUrl={profile.photoUrl}
                verified={profile.verified}
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

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            {t("pagination.previous")}
          </Button>
          <span className="text-sm text-neutral-400">
            {t("pagination.pageOf", { page: currentPage, total: totalPages })}
          </span>
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            {t("pagination.next")}
          </Button>
        </div>
      )}

      <FabCreate />
    </div>
  );
}