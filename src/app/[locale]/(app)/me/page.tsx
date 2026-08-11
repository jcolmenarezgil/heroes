"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowDownTrayIcon, ArrowLeftIcon, PencilSquareIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import ProfileCard from "@/components/ui/ProfileCard";
import RoleBadge from "@/components/ui/RoleBadge";
import Section from "@/components/ui/Section";
import PhoneList from "@/components/ui/PhoneList";
import UserDetailSkeleton from "@/components/UserDetailSkeleton";
import { useToast } from "@/components/providers/ToastProvider";
import { useRouter } from "@/i18n/navigation";
import { ApiError, getMe, listProfiles } from "@/lib/api-client";
import type { UserDTO } from "@/types/user";
import type { ProfileListResponse } from "@/types/profile";

const PAGE_SIZE = 20;

export default function MyProfilePage() {
  const t = useTranslations("myProfile");
  const format = useFormatter();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { addToast } = useToast();

  const [user, setUser] = useState<UserDTO | null>(null);
  const [reports, setReports] = useState<ProfileListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    if (sessionStatus !== "authenticated" || !session?.user?.id) return;

    let cancelled = false;

    Promise.all([
      getMe(),
      listProfiles({ createdBy: session.user.id, page, limit: PAGE_SIZE }),
    ])
      .then(([userData, reportsData]) => {
        if (!cancelled) {
          setUser(userData);
          setReports(reportsData);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          router.push("/login");
        } else {
          addToast(t("loadError"), "error");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionStatus, session?.user?.id, page, addToast, t, router]);

  const handleExport = () => {
    if (!user) return;
    const blob = new Blob([JSON.stringify(user, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(user.fullName || user.name || "user").replace(/\s+/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast(t("exportSuccess"), "success");
  };

  if (isLoading || sessionStatus === "loading") {
    return <UserDetailSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-white">{t("loadError")}</p>
        <Link href="/" className="mt-4 text-white underline underline-offset-4">
          {t("backToHome")}
        </Link>
      </div>
    );
  }

  const displayName = user.fullName || user.name || user.email;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-lg lg:max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-neutral-900"
          aria-label={t("backToHome")}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>

        <Link
          href="/me/edit"
          className="flex h-11 min-w-11 items-center gap-2 rounded-lg border border-neutral-700 px-3 text-white transition hover:bg-neutral-900"
        >
          <PencilSquareIcon className="h-5 w-5" />
          <span className="text-sm font-medium">{t("actions.edit")}</span>
        </Link>
      </div>

      <div className="space-y-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="space-y-6">
            {user.image ? (
              <div className="relative h-40 w-40 overflow-hidden rounded-full">
                <Image
                  src={user.image}
                  alt=""
                  fill
                  sizes="160px"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-full bg-neutral-900 text-4xl font-medium text-neutral-500">
                {initials}
              </div>
            )}

            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-white">{displayName}</h1>
              <RoleBadge role={user.role} />
            </div>

            <p className="text-sm text-neutral-400">{user.email}</p>

            <Button variant="secondary" onClick={handleExport}>
              <span className="flex items-center gap-2">
                <ArrowDownTrayIcon className="h-5 w-5" />
                {t("actions.export")}
              </span>
            </Button>
          </div>

          <div className="mt-6 space-y-0 lg:mt-0">
            <Section
              label={t("sections.demographics")}
              value={
                <div className="space-y-1">
                  <p>
                    <span className="text-neutral-400">{t("fields.dob")}:</span>{" "}
                    {user.dob
                      ? format.dateTime(new Date(user.dob), {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : t("notSpecified")}
                  </p>
                  <p>
                    <span className="text-neutral-400">{t("fields.gender")}:</span>{" "}
                    {user.gender ? t(`gender.${user.gender}`) : t("notSpecified")}
                  </p>
                </div>
              }
              first
            />

            <Section
              label={t("sections.phones")}
              value={<PhoneList phones={user.phoneNumbers} />}
            />

            <div className="border-t border-neutral-900 py-4 text-xs text-neutral-500">
              <p>
                {t("memberSince", {
                  date: format.dateTime(new Date(user.createdAt), {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }),
                })}
              </p>
              <p className="mt-1">
                {t("updatedAt", {
                  date: format.dateTime(new Date(user.updatedAt), {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  }),
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-900 pt-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            {t("sections.myReports")}
          </h2>
          {reports && reports.profiles.length > 0 ? (
            <div className="space-y-0 divide-y divide-neutral-900 rounded-lg border border-neutral-900">
              {reports.profiles.map((profile) => (
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
            <div className="rounded-lg border border-neutral-900 p-6 text-center">
              <p className="text-sm text-neutral-400">
                {t("emptyStates.noReports")}
              </p>
              <Link
                href="/create"
                className="mt-2 inline-block text-sm font-medium text-white underline underline-offset-4"
              >
                {t("emptyStates.createReport")}
              </Link>
            </div>
          )}

          {reports && reports.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                {t("pagination.previous")}
              </Button>
              <span className="text-sm text-neutral-400">
                {t("pagination.pageOf", {
                  page,
                  total: reports.totalPages,
                })}
              </span>
              <Button
                variant="secondary"
                onClick={() =>
                  setPage((p) => Math.min(reports.totalPages, p + 1))
                }
                disabled={page >= reports.totalPages}
              >
                {t("pagination.next")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
