"use client";

import React, { useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import ProfileForm, { ProfileFormData } from "@/components/ProfileForm";
import ProfileFormSkeleton from "@/components/ProfileFormSkeleton";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError, createProfile } from "@/lib/api-client";

function CreateProfileContent() {
  const t = useTranslations("profile");
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const { addToast } = useToast();
  const searchParams = useSearchParams();

  // Lectura y parseo seguro de coordenadas desde la URL
  const rawLat = searchParams.get("lat");
  const rawLng = searchParams.get("lng");

  const initialLat =
    rawLat && !Number.isNaN(parseFloat(rawLat)) ? parseFloat(rawLat) : null;
  const initialLng =
    rawLng && !Number.isNaN(parseFloat(rawLng)) ? parseFloat(rawLng) : null;

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [sessionStatus, router]);

  const handleSubmit = async (data: ProfileFormData, file: File | null) => {
    try {
      let uploadedPhotoUrl = data.photoUrl;

      // Si existe un archivo adjunto, aquí se debe procesar la subida antes de guardar el perfil
      if (file) {
        // Ejemplo de integracion futura:
        // const formData = new FormData();
        // formData.append("file", file);
        // const uploadRes = await uploadPhotoApi(formData);
        // uploadedPhotoUrl = uploadRes.url;
      }

      const created = await createProfile({
        name: data.name,
        photoUrl: uploadedPhotoUrl ?? null,
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
      {/* 
        La propiedad key re-inicializa el formulario de forma limpia 
        si las coordenadas iniciales cambian tras la hidratación.
      */}
      <ProfileForm
        key={`${initialLat}-${initialLng}`}
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

export default function CreateProfilePage() {
  return (
    <Suspense fallback={<ProfileFormSkeleton />}>
      <CreateProfileContent />
    </Suspense>
  );
}