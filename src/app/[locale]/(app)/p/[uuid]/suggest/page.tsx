"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import ProfileDetailSkeleton from "@/components/ProfileDetailSkeleton";
import SuggestionForm from "@/components/SuggestionForm";
import { ApiError, getPublicProfile } from "@/lib/api-client";
import type { PublicProfileDTO } from "@/types/profile";

export default function SuggestPage() {
  const t = useTranslations("profile");
  const params = useParams();
  const uuid = params.uuid as string;

  const [profile, setProfile] = useState<PublicProfileDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPublicProfile(uuid)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          setNotFound(true);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uuid]);

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

  return <SuggestionForm profileId={profile.id} showProfileName />;
}