"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import ProfileForm, { ProfileFormData } from "@/components/ProfileForm";
import ProfileFormSkeleton from "@/components/ProfileFormSkeleton";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError, createProfile } from "@/lib/api-client";
import { useSearchParams } from "next/navigation";

export default function CreateProfilePage() {
  const t = useTranslations("profile");
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const { addToast } = useToast();
  const searchParams = useSearchParams();

  // Lectura con validación para evitar NaN
  const rawLat = searchParams.get("lat");
  const rawLng = searchParams.get("lng");

  const initialLat = rawLat && !Number.isNaN(parseFloat(rawLat))
    ? parseFloat(rawLat)
    : null;
  const initialLng = rawLng && !Number.isNaN(parseFloat(rawLng))
    ? parseFloat(rawLng)
    : null;

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [sessionStatus, router]);

  const handleSubmit = async (data: ProfileFormData, _file: File | null) => {
    void _file;
    try {
      const created = await createProfile({
        name: data.name,
        photoUrl: null,
        lastKnownLocation: data.lastKnownLocation,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
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
      // rethrow so ProfileForm shows the error toast
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
          lastKnownLocation: "",
          latitude: initialLat,
          longitude: initialLng,
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