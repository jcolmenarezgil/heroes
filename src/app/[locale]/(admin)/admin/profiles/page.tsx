"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useFormatter } from "next-intl";
import StatusBadge from "@/components/ui/StatusBadge";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import AvatarPlaceholder from "@/components/ui/AvatarPlaceholder";
import Skeleton from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import ProfileJsonImporter from "@/components/admin/ProfileJsonImporter"; // <-- Componente incorporado
import {
  MagnifyingGlassIcon,
  SearchEmptyIcon,
} from "@/components/icons";
import {
  listProfiles,
  mergeProfiles,
  unverifyProfile,
  verifyProfile,
  type ListProfilesParams,
} from "@/lib/api-client";
import type { ProfileDTO } from "@/types/profile";

type VerifiedFilter = "all" | "verified" | "unverified";

export default function AdminProfilesPage() {
  const t = useTranslations("admin.profiles");
  const tAdmin = useTranslations("admin");
  const tProfile = useTranslations("profile");
  const format = useFormatter();
  const { addToast } = useToast();

  const [profiles, setProfiles] = useState<ProfileDTO[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "active" | "found" | "deceased" | ""
  >("");
  const [verifiedFilter, setVerifiedFilter] =
    useState<VerifiedFilter>("all");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const params: ListProfilesParams = { page, limit: 20 };
    if (debouncedSearch) params.q = debouncedSearch;
    if (statusFilter) params.status = statusFilter;

    listProfiles(params)
      .then((res) => {
        if (cancelled) return;
        setProfiles(res.profiles);
        setTotalPages(res.totalPages);
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          addToast(t("verifyError"), "error");
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, statusFilter, addToast, t]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 2) {
        next.add(id);
      } else {
        const first = next.values().next().value!;
        next.delete(first);
        next.add(id);
      }
      return next;
    });
  };

  const handleVerify = async (profile: ProfileDTO) => {
    setBusyId(profile.id);
    try {
      await verifyProfile(profile.id);
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profile.id
            ? { ...p, verified: new Date().toISOString() }
            : p
        )
      );
      addToast(t("verifySuccess"), "success");
    } catch {
      addToast(t("verifyError"), "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleUnverify = async (profile: ProfileDTO) => {
    setBusyId(profile.id);
    try {
      await unverifyProfile(profile.id);
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profile.id ? { ...p, verified: null } : p
        )
      );
      addToast(t("unverifySuccess"), "success");
    } catch {
      addToast(t("unverifyError"), "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleMerge = async () => {
    if (!mergeTarget) return;
    const selectedArr = Array.from(selected);
    const source = selectedArr.find((id) => id !== mergeTarget);
    if (!source) return;

    setIsMerging(true);
    try {
      await mergeProfiles(source, mergeTarget);
      addToast(t("mergeSuccess"), "success");
      setShowMergeModal(false);
      setSelected(new Set());
      setMergeTarget(null);
      setPage(1);
    } catch {
      addToast(t("mergeError"), "error");
    } finally {
      setIsMerging(false);
    }
  };

  const openMergeModal = () => {
    if (selected.size !== 2) {
      addToast(t("mergeSelectTwo"), "warning");
      return;
    }
    setMergeTarget(null);
    setShowMergeModal(true);
  };

  const selectedProfiles = useMemo(
    () => profiles.filter((p) => selected.has(p.id)),
    [profiles, selected]
  );

  const filteredProfiles = useMemo(() => {
    if (verifiedFilter === "all") return profiles;
    return profiles.filter((p) =>
      verifiedFilter === "verified" ? p.verified : !p.verified
    );
  }, [profiles, verifiedFilter]);

  const refreshList = () => {
    setPage(1);
    setIsLoading(true);
    const params: ListProfilesParams = { page: 1, limit: 20 };
    if (debouncedSearch) params.q = debouncedSearch;
    if (statusFilter) params.status = statusFilter;

    listProfiles(params)
      .then((res) => {
        setProfiles(res.profiles);
        setTotalPages(res.totalPages);
        setIsLoading(false);
      })
      .catch(() => {
        addToast(t("verifyError"), "error");
        setIsLoading(false);
      });
  };

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white md:text-2xl">
            {tAdmin("profilesTitle")}
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            {tAdmin("profilesSubtitle")}
          </p>
        </div>

        <ProfileJsonImporter onSuccess={refreshList} />
      </div>

      {/* Search + filters */}
      <div className="space-y-3 border-b border-neutral-800 pb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="admin-search"
              className="text-xs font-medium text-neutral-500"
            >
              {t("labelSearch")}
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <input
                id="admin-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="input-field max-w-xs rounded-lg py-2 pl-10"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="admin-status"
              className="text-xs font-medium text-neutral-500"
            >
              {t("labelStatus")}
            </label>
            <select
              id="admin-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(
                  e.target.value as "active" | "found" | "deceased" | ""
                );
                setPage(1);
              }}
              className="input-field max-w-[160px] py-2"
            >
              <option value="">{t("filterAll")}</option>
              <option value="active">{tProfile("status.active")}</option>
              <option value="found">{tProfile("status.found")}</option>
              <option value="deceased">{tProfile("status.deceased")}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="admin-verified"
              className="text-xs font-medium text-neutral-500"
            >
              {t("labelVerified")}
            </label>
            <select
              id="admin-verified"
              value={verifiedFilter}
              onChange={(e) =>
                setVerifiedFilter(e.target.value as VerifiedFilter)
              }
              className="input-field max-w-[160px] py-2"
            >
              <option value="all">{t("filterAll")}</option>
              <option value="verified">{t("filterVerified")}</option>
              <option value="unverified">{t("filterUnverified")}</option>
            </select>
          </div>
        </div>

        {/* Selection bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span>{t("selected", { count: selected.size })}</span>
            <button
              onClick={openMergeModal}
              className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-white transition hover:bg-neutral-900"
            >
              {t("merge")}
            </button>
          </div>
        )}
      </div>

      {/* Table — same column structure, home-page styling */}
      <div className="overflow-x-auto rounded-lg border border-neutral-900">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="border-b border-neutral-900 bg-neutral-950 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
              <th className="w-10 px-4 py-2" />
              <th className="px-2 py-2">{t("columnName")}</th>
              <th className="px-2 py-2">{t("columnStatus")}</th>
              <th className="px-2 py-2">{t("columnVerified")}</th>
              <th className="px-2 py-2">{t("columnCreatedBy")}</th>
              <th className="px-2 py-2">{t("columnCreated")}</th>
              <th className="px-4 py-2 text-right">{t("columnActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} aria-hidden="true">
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-4 rounded" />
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <Skeleton className="h-5 w-16" />
                    </td>
                    <td className="px-2 py-3">
                      <Skeleton className="h-5 w-16" />
                    </td>
                    <td className="px-2 py-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-2 py-3">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Skeleton className="h-6 w-12" />
                        <Skeleton className="h-6 w-12" />
                        <Skeleton className="h-6 w-12" />
                      </div>
                    </td>
                  </tr>
                ))
              : filteredProfiles.length === 0
              ? (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center py-16 text-center">
                      <SearchEmptyIcon
                        className="h-12 w-12 text-neutral-500"
                        aria-hidden="true"
                      />
                      <p className="mt-4 text-base font-medium text-white">
                        {t("noResults")}
                      </p>
                    </div>
                  </td>
                </tr>
              )
              : filteredProfiles.map((profile) => (
                  <tr
                    key={profile.id}
                    className={`transition hover:bg-neutral-950 ${
                      selected.has(profile.id) ? "bg-neutral-900" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(profile.id)}
                        onChange={() => toggleSelect(profile.id)}
                        className="h-4 w-4 rounded border-neutral-600 bg-neutral-900"
                      />
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex min-w-0 items-center gap-2">
                        {profile.photoUrl ? (
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-neutral-900">
                            <Image
                              src={profile.photoUrl}
                              alt={profile.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <AvatarPlaceholder size="sm" />
                        )}
                        <Link
                          href={`/p/${profile.id}`}
                          className="min-w-0 truncate text-sm font-medium text-white hover:underline md:text-base"
                        >
                          {profile.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <StatusBadge status={profile.status} />
                    </td>
                    <td className="px-2 py-3">
                      {profile.verified ? (
                        <VerifiedBadge verified={profile.verified} />
                      ) : (
                        <span className="text-xs text-neutral-600">&mdash;</span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-sm text-neutral-400">
                      {profile.createdByName}
                    </td>
                    <td className="px-2 py-3 text-sm text-neutral-400">
                      {format.dateTime(new Date(profile.createdAt), {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {profile.verified ? (
                          <button
                            onClick={() => handleUnverify(profile)}
                            disabled={busyId === profile.id}
                            className="shrink-0 rounded-md bg-yellow-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-yellow-700 disabled:opacity-50"
                          >
                            {t("unverify")}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerify(profile)}
                            disabled={busyId === profile.id}
                            className="shrink-0 rounded-md bg-blue-700 px-2 py-1 text-xs font-medium text-white transition hover:bg-blue-800 disabled:opacity-50"
                          >
                            {t("verify")}
                          </button>
                        )}
                        <Link
                          href={`/p/${profile.id}/edit`}
                          className="shrink-0 rounded-md border border-neutral-700 px-2 py-1 text-xs text-white transition hover:bg-neutral-900"
                        >
                          {t("edit")}
                        </Link>
                        <Link
                          href={`/p/${profile.id}`}
                          className="shrink-0 rounded-md border border-neutral-700 px-2 py-1 text-xs text-white transition hover:bg-neutral-900"
                        >
                          {t("view")}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            {t("prevPage")}
          </Button>
          <span className="text-sm text-neutral-400">
            {t("page", { page, totalPages })}
          </span>
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            {t("nextPage")}
          </Button>
        </div>
      )}

      {/* Merge Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-950 p-6">
            <h2 className="mb-2 text-lg font-semibold text-white">
              {t("mergeTitle")}
            </h2>
            <p className="mb-4 text-sm text-neutral-400">
              {t("mergeDescription")}
            </p>

            <div className="space-y-2">
              {selectedProfiles.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-800 p-3 transition hover:bg-neutral-900"
                >
                  <input
                    type="radio"
                    name="mergeTarget"
                    checked={mergeTarget === p.id}
                    onChange={() => setMergeTarget(p.id)}
                    className="h-4 w-4"
                  />
                  {p.photoUrl ? (
                    <Image
                      src={p.photoUrl}
                      alt={p.name}
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="h-9 w-9 overflow-hidden rounded-full ring-1 ring-inset ring-neutral-800">
                      <AvatarPlaceholder
                        size="sm"
                        className="!h-9 !w-9 rounded-full"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <p className="text-xs text-neutral-500">
                      {p.lastKnownLocation}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={p.status} />
                    {p.verified && (
                      <div className="mt-1">
                        <VerifiedBadge verified={p.verified} />
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {mergeTarget && (
              <p className="mt-4 text-sm text-neutral-300">
                <span className="text-green-500">{t("mergeTarget")}:</span>{" "}
                {selectedProfiles.find((p) => p.id === mergeTarget)?.name}
                {"  \u00b7  "}
                <span className="text-red-500">{t("mergeSource")}:</span>{" "}
                {selectedProfiles.find((p) => p.id !== mergeTarget)?.name}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowMergeModal(false);
                  setMergeTarget(null);
                }}
                disabled={isMerging}
                className="px-4 py-2 text-sm"
              >
                {t("mergeCancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleMerge}
                disabled={!mergeTarget || isMerging}
                className="px-4 py-2 text-sm"
                isLoading={isMerging}
              >
                {t("mergeConfirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}