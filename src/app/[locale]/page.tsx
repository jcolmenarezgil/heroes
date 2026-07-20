"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { signIn, signOut, useSession } from "next-auth/react";

/**
 * OnboardingPage manages both the guest entrance and the post-auth setup wizard.
 * Implements granular control over optional demographic tracking parameters.
 */
export default function OnboardingPage() {
  const t = useTranslations();
  const { data: session, status } = useSession();

  // Local state management for optional parameters
  const [gender, setGender] = useState<"" | "male" | "female">("");
  const [dob, setDob] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // High-speed compilation loading check
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  /**
   * Handles persistence operations for optional profile values.
   */
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Future integration with Server Action or API endpoint will execute here
      console.log("Submitting values to DB:", { gender, dob });
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-xl border border-slate-100 flex flex-col items-center">
        {/* Brand Header Section */}
        <header className="flex items-center justify-center gap-3 mt-4 w-full">
          <Image
            src="/heroes-logo-app.webp"
            alt={t("common.logoAlt")}
            width={174}
            height={202}
            className="h-10 w-auto object-contain"
            priority
          />
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Heroes</h1>
        </header>

        {!session ? (
          /* ================= STATE A: UNAUTHENTICATED ENTRANCE ================= */
          <>
            <section className="text-center mt-6">
              <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
                {t("common.crisisResponse")}
              </h2>
              <p className="text-sm font-medium text-slate-600 mt-1">
                {t("common.missingPersonsLocator")}
              </p>
            </section>

            <div className="relative w-full aspect-[4/3] mt-6 rounded-xl overflow-hidden bg-slate-100">
              <Image
                src="/barner_heroes.webp"
                alt={t("common.crisisResponse")}
                fill
                sizes="(max-w-md) 100vw, 400px"
                className="object-cover"
                priority
              />
            </div>

            <div className="mt-8 space-y-3 w-full">
              <button
                onClick={() => signIn("google")}
                className="w-full rounded-xl bg-red-600 py-3.5 text-sm font-bold tracking-wide text-white uppercase transition-colors hover:bg-red-700 active:bg-red-800"
              >
                {t("auth.loginWithGoogle")}
              </button>

              <button className="w-full rounded-xl bg-white border border-slate-200 py-3.5 text-sm font-bold tracking-wide text-slate-700 uppercase hover:bg-slate-50">
                {t("onboarding.continueWithoutAccount")}
              </button>
            </div>

            <footer className="mt-6 text-center">
              <p className="text-xs leading-relaxed text-slate-500 max-w-xs">
                <span className="font-semibold text-slate-700">
                  {t("onboarding.hintLabel")}
                </span>{" "}
                {t("onboarding.hintText")}
              </p>
            </footer>
          </>
        ) : (
          /* ================= STATE B: AUTHENTICATED ONBOARDING SETUP ================= */
          <div className="w-full mt-6 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-extrabold text-slate-900">
                {t("onboarding.completeProfile")}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {t("onboarding.welcome", { name: session.user?.name || "Hero" })}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50/50 p-4 border border-blue-100 text-xs text-blue-800 leading-relaxed">
              {t("onboarding.optionalNote")}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Optional Field 1: Gender Identifier */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="gender"
                  className="text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  {t("onboarding.gender.label")}{" "}
                  <span className="text-slate-400 font-normal">
                    {t("common.optional")}
                  </span>
                </label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as "" | "male" | "female")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  <option value="">{t("onboarding.gender.placeholder")}</option>
                  <option value="male">{t("onboarding.gender.male")}</option>
                  <option value="female">{t("onboarding.gender.female")}</option>
                </select>
              </div>

              {/* Optional Field 2: Date of Birth */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="dob"
                  className="text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  {t("onboarding.dateOfBirth.label")}{" "}
                  <span className="text-slate-400 font-normal">
                    {t("common.optional")}
                  </span>
                </label>
                <input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              {/* Action Operations Trigger */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-red-600 py-3.5 text-sm font-bold tracking-wide text-white uppercase transition-colors hover:bg-red-700 disabled:bg-slate-300"
                >
                  {isSubmitting
                    ? t("onboarding.saving")
                    : t("onboarding.saveAndContinue")}
                </button>

                <button
                  type="button"
                  onClick={() => signOut()}
                  className="w-full rounded-xl bg-white border border-slate-200 py-2.5 text-xs font-semibold text-slate-500 uppercase transition-colors hover:bg-slate-50"
                >
                  {t("auth.signOut")}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
