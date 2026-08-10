"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/providers/ToastProvider";
import { createSuggestion, getPublicProfile } from "@/lib/api-client";
import { ArrowLeftIcon } from "@/components/icons";

interface SuggestionFormProps {
  profileId: string;
  /**
   * When true, the profile name is fetched and rendered in the heading
   * (useful for a standalone page where the surrounding context doesn't show
   * the name). When false, only the title is shown.
   */
  showProfileName?: boolean;
}

export default function SuggestionForm({
  profileId,
  showProfileName = false,
}: SuggestionFormProps) {
  const t = useTranslations("profile");
  const { addToast } = useToast();
  const { status: sessionStatus } = useSession();
  const [note, setNote] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterContact, setSubmitterContact] = useState("");
  const [profileName, setProfileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Optionally load the profile name for a richer heading.
  React.useEffect(() => {
    if (!showProfileName) return;
    let cancelled = false;
    getPublicProfile(profileId)
      .then((p) => {
        if (!cancelled) setProfileName(p.name);
      })
      .catch(() => {
        /* best-effort */
      });
    return () => {
      cancelled = true;
    };
  }, [profileId, showProfileName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setIsSubmitting(true);
    try {
      await createSuggestion(profileId, {
        note: note.trim(),
        submitterName: submitterName.trim() || undefined,
        submitterContact: submitterContact.trim() || undefined,
      });
      addToast(t("suggestionSubmitted"), "success");
      setNote("");
      setSubmitterName("");
      setSubmitterContact("");
    } catch {
      addToast(t("saveError"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAnon = sessionStatus !== "authenticated";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {showProfileName && (
        <Link
          href={`/p/${profileId}`}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-neutral-900"
          aria-label={t("backToHome")}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
      )}

      <h1 className="text-2xl font-semibold text-white">
        {t("suggestionTitle")}
        {showProfileName && profileName && (
          <span className="block text-base font-normal text-neutral-400">
            {profileName}
          </span>
        )}
      </h1>

      <p className="text-sm text-neutral-400">
        {isAnon ? t("suggestionAnonDescription") : t("suggestionDescription")}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isAnon && (
          <div className="space-y-2">
            <label htmlFor="submitterName" className="text-sm text-neutral-300">
              {t("suggestionNameLabel")}
            </label>
            <input
              id="submitterName"
              type="text"
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
              placeholder={t("suggestionNamePlaceholder")}
              required
              className="input-field"
            />
          </div>
        )}
        {isAnon && (
          <div className="space-y-2">
            <label
              htmlFor="submitterContact"
              className="text-sm text-neutral-300"
            >
              {t("suggestionContactLabel")}
            </label>
            <input
              id="submitterContact"
              type="text"
              value={submitterContact}
              onChange={(e) => setSubmitterContact(e.target.value)}
              placeholder={t("suggestionContactPlaceholder")}
              className="input-field"
            />
          </div>
        )}
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("suggestionPlaceholder")}
          className="min-h-32"
          required
        />
        <Button type="submit" isLoading={isSubmitting}>
          {t("actions.suggestUpdate")}
        </Button>
      </form>
    </div>
  );
}