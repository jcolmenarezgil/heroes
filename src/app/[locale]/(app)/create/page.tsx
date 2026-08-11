"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import ProfileForm, { ProfileFormData } from "@/components/ProfileForm";
import ProfileFormSkeleton from "@/components/ProfileFormSkeleton";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError, createProfile, uploadProfilePhoto } from "@/lib/api-client";
import { MapPinIcon, ArrowPathIcon } from "@/components/icons";

const DRAFT_KEY = "heroes_profile_create_draft";

const emptyProfileData: ProfileFormData = {
  name: "",
  photoUrl: null,
  photoPath: null,
  isMinor: false,
  lastKnownLocation: "",
  latitude: null,
  longitude: null,
  status: "active",
  contactPhone: "",
  notes: "",
};

function CreateProfileContent() {
  const t = useTranslations("profile");
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const { addToast } = useToast();
  const searchParams = useSearchParams();

  const rawLat = searchParams.get("lat");
  const rawLng = searchParams.get("lng");
  const queryLat = rawLat && !Number.isNaN(parseFloat(rawLat)) ? parseFloat(rawLat) : null;
  const queryLng = rawLng && !Number.isNaN(parseFloat(rawLng)) ? parseFloat(rawLng) : null;

  const [initialData, setInitialData] = useState<ProfileFormData | null>(null);
  const [resetVersion, setResetVersion] = useState(0);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
      return;
    }

    let parsedDraft: Partial<ProfileFormData> = {};
    const savedDraft = sessionStorage.getItem(DRAFT_KEY);

    if (savedDraft) {
      try {
        parsedDraft = JSON.parse(savedDraft);
      } catch (e) {
        console.error("Failed to parse draft from sessionStorage", e);
      }
    }

    // Merge the saved draft with URL-pinned coordinates once the session is
    // known. sessionStorage is not available during SSR, so this happens in a
    // client-only effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInitialData({
      name: parsedDraft.name || "",
      photoUrl: parsedDraft.photoUrl || null,
      photoPath: parsedDraft.photoPath || null,
      isMinor: parsedDraft.isMinor || false,
      lastKnownLocation: parsedDraft.lastKnownLocation || "",
      latitude: queryLat ?? parsedDraft.latitude ?? null,
      longitude: queryLng ?? parsedDraft.longitude ?? null,
      status: parsedDraft.status || "active",
      contactPhone: parsedDraft.contactPhone || "",
      notes: parsedDraft.notes || "",
    });
  }, [sessionStatus, queryLat, queryLng, router]);

  const handleResetForm = () => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(emptyProfileData));
    setInitialData({ ...emptyProfileData });
    setResetVersion((prev) => prev + 1); // remount ProfileForm
    if (queryLat !== null || queryLng !== null) {
      router.replace("/create");
    }
  };

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
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        status: data.status,
        contactPhone: data.contactPhone || null,
        notes: data.notes || null,
      });

      handleResetForm();

      addToast(t("saveToast"), "success");
      router.push(`/p/${created.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push("/login");
      }
      throw error;
    }
  };

  const handleOpenMap = () => {
    router.push("/map");
  };

  if (sessionStatus !== "authenticated" || !initialData) {
    return <ProfileFormSkeleton />;
  }

  const hasPinnedCoordinates = initialData.latitude !== null && initialData.longitude !== null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">
          {t("createTitle")}
        </h1>
        <button
          type="button"
          onClick={handleResetForm}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-neutral-500"
        >
          <ArrowPathIcon className="h-3.5 w-3.5" />
          Reset Form
        </button>
      </div>

      {!hasPinnedCoordinates && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-200">
              Do you need to add the location with precision?
            </p>
            <p className="text-xs text-neutral-400">
              Select a point on the interactive map without losing your filled progress.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenMap}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-800 px-3.5 py-2 text-xs font-semibold text-sky-400 border border-neutral-700 hover:bg-neutral-700 hover:border-sky-500/50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <MapPinIcon className="h-4 w-4" />
            Open Map
          </button>
        </div>
      )}

      <ProfileForm
        key={`form-reset-v${resetVersion}`}
        initialData={initialData}
        onSubmit={handleSubmit}
        onChange={(currentData) => {
          sessionStorage.setItem(DRAFT_KEY, JSON.stringify(currentData));
        }}
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