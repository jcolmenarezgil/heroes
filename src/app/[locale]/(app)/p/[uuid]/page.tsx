"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useFormatter, useTranslations } from "next-intl";
import QRCodeLib from "qrcode";
import Image from "next/image";
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  ShareIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/Button";
import AvatarPlaceholder from "@/components/ui/AvatarPlaceholder";
import QRCode from "@/components/ui/QRCode";
import Section from "@/components/ui/Section";
import StatusBadge from "@/components/ui/StatusBadge";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import ProfileDetailSkeleton from "@/components/ProfileDetailSkeleton";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError, getPublicProfile, listSuggestions } from "@/lib/api-client";
import type { PublicProfileDTO } from "@/types/profile";

export default function ProfileDetailPage() {
  const t = useTranslations("profile");
  const format = useFormatter();
  const params = useParams();
  const { addToast } = useToast();
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicProfileDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pendingSuggestions, setPendingSuggestions] = useState(0);
  const [isPendingSuggestionsLoading, setIsPendingSuggestionsLoading] =
      useState(true);

  const { status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === "authenticated";

  const uuid = params.uuid as string;

  useEffect(() => {
    let cancelled = false;
    getPublicProfile(uuid)
      .then((data) => {
        if (!cancelled) setProfile(data);
        // Only owners/rescuers/admins can see the pending count.
        if (data.canEdit) {
          listSuggestions(uuid, { status: "pending", limit: 1 })
            .then((res) => {
              if (cancelled) return;
              setPendingSuggestions(res.pendingCount);
              setIsPendingSuggestionsLoading(false);
            })
            .catch(() => {
              if (cancelled) return;
              setIsPendingSuggestionsLoading(false);
            });
        } else {
          setIsPendingSuggestionsLoading(false);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          setNotFound(true);
        } else {
          addToast(t("saveError"), "error");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uuid, addToast, t]);

  const profileUrl =
    typeof window !== "undefined" && profile
      ? `${window.location.origin}/p/${profile.id}`
      : "";

  useEffect(() => {
    if (!profileUrl) return;
    QRCodeLib.toDataURL(profileUrl, {
      width: 320,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    }).then(setQrUrl);
  }, [profileUrl]);

  if (isLoading) {
    return <ProfileDetailSkeleton />;
  }

  if (notFound || !profile) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-white">{t("notFound")}</p>
        <Link href="/" className="mt-4 text-white underline underline-offset-4">
          {t("backToHome")}
        </Link>
      </div>
    );
  }

  const canEditDirectly = profile.canEdit;

  const canShare =
    typeof navigator !== "undefined" && "share" in navigator;

  const handleShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: profile.name,
        text: profile.lastKnownLocation,
        url: profileUrl,
      });
    } catch {
      // user cancelled
    }
  };

  const handleDownloadQr = () => {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `${profile.name.replace(/\s+/g, "_")}_qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${profile.name.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast(t("exportSuccess"), "success");
  };

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

        {canEditDirectly ? (
          <Link
            href={`/p/${profile.id}/edit`}
            className="flex h-11 min-w-11 items-center gap-2 rounded-lg border border-neutral-700 px-3 text-white transition hover:bg-neutral-900"
          >
            <PencilSquareIcon className="h-5 w-5" />
            <span className="text-sm font-medium">{t("actions.edit")}</span>
          </Link>
        ) : (
          <Link
            href={`/p/${profile.id}/suggest`}
            className="flex h-11 min-w-11 items-center gap-2 rounded-lg border border-neutral-700 px-3 text-white transition hover:bg-neutral-900"
          >
            <PencilSquareIcon className="h-5 w-5" />
            <span className="text-sm font-medium">
              {t("actions.suggestUpdate")}
            </span>
          </Link>
        )}
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-8">
        <div className="space-y-6">
          {profile.photoUrl ? (
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-neutral-900">
              <Image
                src={profile.photoUrl}
                alt={profile.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-neutral-900">
              <AvatarPlaceholder size="lg" />
            </div>
          )}

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-white">
              {profile.name}
            </h1>
            <div className="flex items-center gap-2">
              {profile.verified && <VerifiedBadge verified={profile.verified} />}
              <StatusBadge status={profile.status} />
            </div>
          </div>

          {profile.isMinor && (
            <p className="rounded-lg border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs text-neutral-400">
              {t("minorDisclaimer")}
            </p>
          )}

          <Button variant="secondary" onClick={handleExportJson}>
            <span className="flex items-center gap-2">
              <ArrowDownTrayIcon className="h-5 w-5" />
              {t("actions.export")}
            </span>
          </Button>
        </div>

        <div className="mt-6 space-y-0 lg:mt-0">
          <Section label={t("sections.lastKnownLocation")} value={profile.lastKnownLocation} first />
          {isAuthenticated && (
            <Section
              label={t("sections.contact")}
              value={profile.contactPhone || t("noContact")}
            />
          )}
          {isAuthenticated && (
            <Section
              label={t("sections.notes")}
              value={profile.notes || t("noNotes")}
            />
          )}

          <div className="border-t border-neutral-900 py-6">
            <QRCode value={profileUrl} alt={t("qrAlt", { name: profile.name })} className="mx-auto" />

            <div className={`mt-4 grid gap-3 ${canShare ? "grid-cols-2" : "grid-cols-1"}`}>
              {canShare && (
                <Button variant="secondary" onClick={handleShare}>
                  <span className="flex items-center gap-2">
                    <ShareIcon className="h-5 w-5" />
                    {t("actions.share")}
                  </span>
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={handleDownloadQr}
                disabled={!qrUrl}
              >
                <span className="flex items-center gap-2">
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  {t("actions.download")}
                </span>
              </Button>
            </div>
          </div>

          {profile.canEdit && isPendingSuggestionsLoading && (
            <Skeleton className="h-4 w-40" />
          )}
          {profile.canEdit &&
              !isPendingSuggestionsLoading &&
              pendingSuggestions > 0 && (
            <Link
              href={`/p/${profile.id}/edit`}
              className="my-4 block text-sm text-amber-200 underline"
            >
              {t("suggestionPendingCount", { count: pendingSuggestions })}
            </Link>
          )}

          <div className="border-t border-neutral-900 py-4 text-xs text-neutral-500">
            <p>
              {profile.createdByName
                ? t("createdBy", {
                    name: profile.createdByName,
                    date: format.dateTime(new Date(profile.createdAt), {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    }),
                  })
                : t("createdOn", {
                    date: format.dateTime(new Date(profile.createdAt), {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    }),
                  })}
            </p>
            {profile.updatedAt !== profile.createdAt && (
              <p className="mt-1">
                {t("lastUpdated", {
                  date: format.dateTime(new Date(profile.updatedAt), {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  }),
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

