"use client";

import React, { useEffect, useMemo, useState } from "react";
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
type StatusFilter = "all" | "active" | "found" | "deceased";

export default function HomePage() {
  const t = useTranslations("home");
  const tProfile = useTranslations("profile");
  const tConnectivity = useTranslations("connectivity");
  const tAdmin = useTranslations("admin.profiles");
  const format = useFormatter();
  const router = useRouter();
  const { addToast } = useToast();
  const { lastSync, isOnline } = useSync();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileDTO[]>([]);

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  // Read from IndexedDB / Local Cache
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

  // Dynamic Metrics derived from cached data
  const metrics = useMemo(() => {
    const total = profiles.length;
    const active = profiles.filter((p) => p.status === "active").length;
    const found = profiles.filter((p) => p.status === "found").length;
    const deceased = profiles.filter((p) => p.status === "deceased").length;
    return { total, active, found, deceased };
  }, [profiles]);

  // Filtered dataset
  const filteredProfiles = useMemo(() => {
    if (statusFilter === "all") return profiles;
    return profiles.filter((p) => p.status === statusFilter);
  }, [profiles, statusFilter]);

  const totalPages = Math.ceil(filteredProfiles.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const results = filteredProfiles.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="flex flex-col space-y-6 pb-12">
      {/* 1. Header & Connectivity Context */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{t("title")}</h1>
          <p className="mt-1 text-sm text-neutral-400">{t("subtitle")}</p>
        </div>

        {/* Dynamic Offline Badge using connectivity i18n */}
        {!isOnline && (
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            {tConnectivity("offline")}
          </div>
        )}
      </div>

      {/* 2. Quick Metrics */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-md bg-neutral-800 px-3 py-1.5">
            <span className="text-sm font-medium text-neutral-300">{tAdmin("filterAll")}</span>
            <span className="text-base font-bold text-white">{metrics.total}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-1.5">
            <span className="text-sm font-medium text-red-100">{tProfile("status.active")}</span>
            <span className="text-base font-bold text-white">{metrics.active}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md bg-green-700 px-3 py-1.5">
            <span className="text-sm font-medium text-green-100">{tProfile("status.found")}</span>
            <span className="text-base font-bold text-white">{metrics.found}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md bg-yellow-600 px-3 py-1.5">
            <span className="text-sm font-medium text-yellow-100">{tProfile("status.deceased")}</span>
            <span className="text-base font-bold text-white">{metrics.deceased}</span>
          </div>
        </div>
        <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-500">
          {t("metrics")}
        </p>
      </div>

      {/* 3. Control Bar: Search & Status Filters */}
      <div className="sticky top-14 z-20 space-y-3 rounded-xl border border-neutral-800 bg-neutral-950/80 p-3 backdrop-blur-md">
        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="input-field pl-10 text-sm"
          />
        </div>

        {/* Filter Chips using translation namespaces */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1">
          {(["all", "active", "found", "deceased"] as StatusFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setStatusFilter(filter);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${statusFilter === filter
                  ? "bg-white text-neutral-950"
                  : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }`}
            >
              {filter === "all" ? tAdmin("filterAll") : tProfile(`status.${filter}`)}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Results List & States */}
      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/30">
        <div className="grid grid-cols-[56px_1fr_auto] items-center gap-3 border-b border-neutral-800 bg-neutral-950/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          <span className="sr-only">{t("photoHeader")}</span>
          <span>{t("personHeader")}</span>
          <span className="text-right">{t("statusHeader")}</span>
        </div>

        {isLoading ? (
          <div className="divide-y divide-neutral-800">
            <Skeleton className="h-24 w-full bg-neutral-900" />
            <Skeleton className="h-24 w-full bg-neutral-900" />
            <Skeleton className="h-24 w-full bg-neutral-900" />
          </div>
        ) : results.length > 0 ? (
          <div className="divide-y divide-neutral-800/60">
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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-neutral-900 p-4">
              <SearchEmptyIcon className="h-8 w-8 text-neutral-500" aria-hidden="true" />
            </div>
            <p className="mt-4 text-base font-medium text-white">
              {t("noResults")}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              {t("emptyState")}
            </p>
            <Link
              href="/create"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-neutral-950 transition-colors hover:bg-neutral-200"
            >
              {t("createNew")}
            </Link>
          </div>
        )}
      </div>

      {/* 5. Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            {t("pagination.previous")}
          </Button>
          <span className="text-xs text-neutral-400">
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