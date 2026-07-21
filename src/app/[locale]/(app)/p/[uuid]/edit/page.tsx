"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "@/i18n/navigation";
import ProfileForm, { ProfileFormData } from "@/components/ProfileForm";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/providers/ToastProvider";
import { findProfileById } from "@/lib/mock";

export default function EditProfilePage() {
  const t = useTranslations("profile");
  const params = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const { addToast } = useToast();

  const profile = findProfileById(params.uuid as string);

  const canEditDirectly =
    session?.user?.role === "admin" ||
    session?.user?.role === "rescuer" ||
    (session?.user?.id && session.user.id === profile?.userId);

  const handleSubmit = async (data: ProfileFormData, file: File | null) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Updating profile:", data, file?.name);
    addToast(t("updateSuccess"), "success");
    router.push(`/p/${profile?.id}`);
  };

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

  if (!canEditDirectly) {
    return <SuggestionView profileId={profile.id} />;
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

function SuggestionView({ profileId }: { profileId: string }) {
  const t = useTranslations("profile");
  const { addToast } = useToast();
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Suggestion for", profileId, note);
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
