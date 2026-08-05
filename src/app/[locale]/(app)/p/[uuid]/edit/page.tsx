"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "@/i18n/navigation";
import ProfileForm, { ProfileFormData } from "@/components/ProfileForm";
import ProfileFormSkeleton from "@/components/ProfileFormSkeleton";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError, getProfile, updateProfile, uploadProfilePhoto } from "@/lib/api-client";
import type { ProfileDTO } from "@/types/profile";

export default function EditProfilePage() {
  const t = useTranslations("profile");
  const tErrors = useTranslations("errors");
  const params = useParams();
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { addToast } = useToast();

  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const uuid = params.uuid as string;

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    let cancelled = false;
    getProfile(uuid)
      .then((data) => {
        if (!cancelled) setProfile(data);
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

  const canEditDirectly =
    session?.user?.role === "admin" ||
    session?.user?.role === "rescuer" ||
    (session?.user?.id && session.user.id === profile?.userId);

  const handleSubmit = async (data: ProfileFormData, file: File | null) => {
    if (!profile) return;
    try {
      let photoUrl = data.photoUrl;
      let photoPath = data.photoPath;

      if (file) {
        const uploaded = await uploadProfilePhoto(file);
        photoUrl = uploaded.url;
        photoPath = uploaded.path;
      }

      await updateProfile(profile.id, {
        name: data.name,
        photoUrl,
        photoPath,
        isMinor: data.isMinor,
        lastKnownLocation: data.lastKnownLocation,
        status: data.status,
        contactPhone: data.contactPhone || null,
        notes: data.notes || null,
      });
      addToast(t("saveToast"), "success");
      router.push(`/p/${profile.id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          router.push("/login");
        }
        if (error.status === 403) {
          addToast(tErrors("unauthorized"), "error");
          return;
        }
      }
      throw error;
    }
  };

  if (isLoading || sessionStatus === "loading") {
    return <ProfileFormSkeleton />;
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

  if (!canEditDirectly) {
    return <SuggestionView />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-white">
        {t("editTitle")}
      </h1>
      <ProfileForm
        initialData={{
          id: profile.id,
          name: profile.name,
          photoUrl: profile.photoUrl,
          photoPath: null,
          isMinor: profile.isMinor,
          lastKnownLocation: profile.lastKnownLocation,
          status: profile.status,
          contactPhone: profile.contactPhone || "",
          notes: profile.notes || "",
        }}
        onSubmit={handleSubmit}
        submitLabel={t("actions.save")}
        cancelHref={`/p/${profile.id}`}
      />
    </div>
  );
}

function SuggestionView() {
  const t = useTranslations("profile");
  const { addToast } = useToast();
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addToast(t("suggestionSubmitted"), "success");
    setNote("");
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-white">
        {t("suggestionTitle")}
      </h1>
      <p className="text-sm text-neutral-400">{t("suggestionDescription")}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("suggestionPlaceholder")}
          className="min-h-32"
        />
        <Button type="submit">{t("actions.suggestUpdate")}</Button>
      </form>
    </div>
  );
}
