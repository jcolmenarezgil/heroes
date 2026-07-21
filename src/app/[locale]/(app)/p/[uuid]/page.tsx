"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import QRCodeLib from "qrcode";
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  ShareIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/Button";
import AvatarPlaceholder from "@/components/ui/AvatarPlaceholder";
import QRCode from "@/components/ui/QRCode";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/providers/ToastProvider";
import { findProfileById } from "@/lib/mock";

export default function ProfileDetailPage() {
  const t = useTranslations("profile");
  const params = useParams();
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const profile = findProfileById(params.uuid as string);
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

  if (!profile) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-white">{t("notFound")}</p>
        <Link href="/" className="mt-4 text-white underline underline-offset-4">
          {t("backToHome")}
        </Link>
      </div>
    );
  }

  const canEditDirectly =
    session?.user?.role === "admin" ||
    session?.user?.role === "rescuer" ||
    session?.user?.id === profile.userId;

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
      {/* Top nav actions */}
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
          <button
            onClick={() => addToast(t("suggestionComingSoon"), "warning")}
            className="flex h-11 min-w-11 items-center gap-2 rounded-lg border border-neutral-700 px-3 text-white transition hover:bg-neutral-900"
          >
            <PencilSquareIcon className="h-5 w-5" />
            <span className="text-sm font-medium">
              {t("actions.suggestUpdate")}
            </span>
          </button>
        )}
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-8">
        {/* Left column */}
        <div className="space-y-6">
          {profile.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photoUrl}
              alt={profile.name}
              className="aspect-[3/4] w-full rounded-lg bg-neutral-900 object-cover"
            />
          ) : (
            <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-neutral-900">
              <AvatarPlaceholder size="lg" />
            </div>
          )}

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-white">
              {profile.name}
            </h1>
            <StatusBadge status={profile.status} />
          </div>

          <Button variant="secondary" onClick={handleExportJson}>
            <span className="flex items-center gap-2">
              <ArrowDownTrayIcon className="h-5 w-5" />
              {t("actions.export")}
            </span>
          </Button>
        </div>

        {/* Right column */}
        <div className="mt-6 space-y-0 lg:mt-0">
          <Section label={t("sections.lastKnownLocation")} value={profile.lastKnownLocation} first />
          <Section
            label={t("sections.contact")}
            value={profile.contactPhone || t("noContact")}
          />
          <Section
            label={t("sections.notes")}
            value={profile.notes || t("noNotes")}
          />

          {/* QR code */}
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
        </div>
      </div>
    </div>
  );
}

function Section({
  label,
  value,
  first = false,
}: {
  label: string;
  value: string;
  first?: boolean;
}) {
  return (
    <div className={`py-4 ${first ? "" : "border-t border-neutral-900"}`}>
      <p className="text-sm text-neutral-400">{label}</p>
      <p className="mt-1 text-base text-white">{value}</p>
    </div>
  );
}
