"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import ProfileForm, { ProfileFormData } from "@/components/ProfileForm";
import { ApiError, createProfile } from "@/lib/api-client";

export default function CreateProfilePage() {
  const t = useTranslations("profile");
  const router = useRouter();

  const handleSubmit = async (data: ProfileFormData, _file: File | null) => {
    void _file; // photo upload is not implemented yet
    try {
      // photo upload is not implemented yet; blob previews are not persisted
      const created = await createProfile({
        name: data.name,
        photoUrl: null,
        lastKnownLocation: data.lastKnownLocation,
        status: data.status,
        contactPhone: data.contactPhone || null,
        notes: data.notes || null,
      });
      router.push(`/p/${created.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push("/login");
        return;
      }
      // rethrow so ProfileForm shows the error toast
      throw error;
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-white">
        {t("createTitle")}
      </h1>
      <ProfileForm
        initialData={{
          name: "",
          photoUrl: null,
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
