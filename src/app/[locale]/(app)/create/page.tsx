"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import ProfileForm, { ProfileFormData } from "@/components/ProfileForm";
import { useToast } from "@/components/providers/ToastProvider";

export default function CreateProfilePage() {
  const t = useTranslations("profile");
  const router = useRouter();
  const { addToast } = useToast();

  const handleSubmit = async (data: ProfileFormData, file: File | null) => {
    // Placeholder: simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newId = crypto.randomUUID();
    console.log("Creating profile:", data, file?.name);
    addToast(t("createSuccess"), "success");
    router.push(`/p/${newId}`);
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
