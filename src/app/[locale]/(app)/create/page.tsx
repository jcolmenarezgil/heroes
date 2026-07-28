"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import ProfileForm, { ProfileFormData } from "@/components/ProfileForm";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError, createProfile } from "@/lib/api-client";

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
      // The home list is only updated on the scheduled/manual sync.
      // Notify the user so the delay is not mistaken for a bug.
      addToast(t("saveToast"), "success");
      router.push(`/p/${created.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push("/login");
      }
      // rethrow so ProfileForm shows the error toast
      throw error;
    }
  };

  if (sessionStatus !== "authenticated") {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="aspect-[3/4] w-full rounded-lg" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
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
