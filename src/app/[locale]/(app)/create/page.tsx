"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import ProfileForm, { ProfileFormData } from "@/components/ProfileForm";
import ProfileFormSkeleton from "@/components/ProfileFormSkeleton";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError, createProfile, uploadProfilePhoto } from "@/lib/api-client";

export default function CreateProfilePage() {
  const t = useTranslations("profile");
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const { addToast } = useToast();

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [sessionStatus, router]);

  const handleSubmit = async (data: ProfileFormData, file: File | null) => {
    try {
      let photoUrl = data.photoUrl;
      let photoPath = data.photoPath;

      if (file) {
        const uploaded = await uploadProfilePhoto(file);
        photoUrl = uploaded.url;
        photoPath = uploaded.path;
      }

      const created = await createProfile({
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
      router.push(`/p/${created.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push("/login");
      }
      throw error;
    }
  };

  if (sessionStatus !== "authenticated") {
    return <ProfileFormSkeleton />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-white">
        {t("createTitle")}
      </h1>
      <ProfileForm
        initialData={{
          name: "",
          photoUrl: null,
          photoPath: null,
          isMinor: false,
          lastKnownLocation: "",
          status: "active",
          contactPhone: "",
          notes: "",
        }}
        onSubmit={handleSubmit}
        submitLabel={t("actions.save")}
        cancelHref="/"
      />
    </div>
  );
}
