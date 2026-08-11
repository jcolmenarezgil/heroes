"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useSync } from "@/components/providers/SyncProvider";
import { searchCachedProfiles } from "@/lib/profiles-cache";
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  BookIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@/components/icons";

export default function HomePage() {
  const t = useTranslations("home");
  const tConnectivity = useTranslations("connectivity");
  const tBreadcrumbs = useTranslations("breadcrumbs");
  const { isOnline, lastSync } = useSync();
  const { status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === "authenticated";

  const [profileCount, setProfileCount] = useState(0);

  // Keep the total profile count for the search tile badge.
  useEffect(() => {
    if (!isAuthenticated) return;
    let isSubscribed = true;
    searchCachedProfiles("").then((res) => {
      if (isSubscribed) setProfileCount(res.length);
    });
    return () => {
      isSubscribed = false;
    };
  }, [lastSync, isAuthenticated]);

  const header = (
    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          {t("dashboard.title")}
        </h1>
        <p className="mt-0.5 text-xs text-neutral-400 sm:text-sm">
          {t("dashboard.subtitle")}
        </p>
      </div>

      {!isOnline && (
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
          {tConnectivity("offline")}
        </div>
      )}
    </div>
  );

  // Logged-out landing: hero, sign-in CTA, and the actions that work without
  // an account.
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col space-y-6 pb-6">
        {!isOnline && (
          <div className="inline-flex items-center gap-2 self-end rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            {tConnectivity("offline")}
          </div>
        )}

        <div className="mx-auto w-full max-w-md sm:max-w-lg">
          <div className="flex flex-col items-center text-center">
            <Image
              src="/logo.svg"
              alt="Heroes"
              width={280}
              height={280}
              className="mt-8 h-36 w-auto sm:h-52"
              priority
              unoptimized
            />
            <h1 className="font-brand mt-3 text-5xl font-normal text-white sm:text-6xl">
              Heroes
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              {t("guest.tagline")}
            </p>
            <p className="mt-2 max-w-md text-sm text-neutral-400">
              {t("guest.mission")}
            </p>
          </div>

          <Link
            href={{ pathname: "/login", query: { callbackUrl: "/" } }}
            className="btn-primary mt-6 flex items-center justify-center gap-2"
          >
            <UserPlusIcon className="h-5 w-5" />
            {t("guest.signIn")}
          </Link>

          <p className="mt-8 text-center text-[10px] font-medium uppercase tracking-widest text-neutral-500">
            {t("dashboard.title")}
          </p>

          <div className="mt-3 flex w-full flex-col items-center">
            <div className="flex min-h-44 w-2/3 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-rose-500/40 bg-rose-950/10 p-2.5 text-center">
              <UserPlusIcon className="h-8 w-8 text-red-400/80 sm:h-10 sm:w-10" />
              <span className="text-sm font-bold text-neutral-200 sm:text-base">
                {t("actions.reportPerson")}
              </span>
              <span className="text-[11px] text-neutral-500 sm:text-xs">
                {t("guest.reportPersonDesc")}
              </span>
            </div>

            <div className="mt-3 grid w-full grid-cols-2 gap-3">
              <Link
                href="/centers"
                className="group flex min-h-44 flex-col items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 p-2.5 text-center transition-all hover:border-neutral-700 hover:bg-neutral-900 active:scale-[0.98]"
              >
                <MapPinIcon className="h-8 w-8 text-white sm:h-10 sm:w-10" />
                <span className="text-sm font-bold text-white sm:text-base">
                  {t("actions.nearbyCenters")}
                </span>
                <span className="text-[11px] text-neutral-400 sm:text-xs">
                  {t("actions.nearbyCentersDesc")}
                </span>
              </Link>

              <Link
                href="/protocol"
                className="group flex min-h-44 flex-col items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 p-2.5 text-center transition-all hover:border-neutral-700 hover:bg-neutral-900 active:scale-[0.98]"
              >
                <BookIcon className="h-8 w-8 text-white sm:h-10 sm:w-10" />
                <span className="text-sm font-bold text-white sm:text-base">
                  {t("actions.guideProtocol")}
                </span>
                <span className="text-[11px] text-neutral-400 sm:text-xs">
                  {t("actions.guideProtocolDesc")}
                </span>
              </Link>
            </div>
          </div>

          <p className="mt-4 whitespace-pre-line text-center text-xs text-neutral-500 sm:text-sm">
            {t("guest.info")}
          </p>

          <div className="mt-8">
            <p className="text-center text-[10px] font-medium uppercase tracking-widest text-neutral-500">
              {t("guest.howTitle")}
            </p>

            <div className="mt-3 space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-neutral-300">
                  <UserPlusIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {t("guest.steps.report.title")}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {t("guest.steps.report.desc")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-neutral-300">
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {t("guest.steps.search.title")}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {t("guest.steps.search.desc")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-neutral-300">
                  <ChatBubbleBottomCenterTextIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {t("guest.steps.coordinate.title")}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {t("guest.steps.coordinate.desc")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <footer className="mt-8 border-t border-neutral-900 pt-4 text-center">
            <Link
              href="/about"
              className="text-xs text-neutral-400 transition-colors hover:text-white"
            >
              {tBreadcrumbs("about")}
            </Link>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 pb-6">
      {header}

      <div className="mx-auto mt-2 w-full max-w-md grid grid-cols-2 gap-3 sm:mt-3 sm:max-w-lg sm:gap-4">
        <Link
          href="/create"
          className="group relative flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-rose-500/40 p-2.5 text-center transition-all hover:border-rose-500/70 active:scale-[0.98]"
        >
          <span className="absolute right-2 top-2 rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
            {t("actions.urgent")}
          </span>
          <UserPlusIcon className="h-8 w-8 text-red-500 sm:h-10 sm:w-10" />
          <span className="text-sm font-bold text-white group-hover:text-rose-200 sm:text-base">
            {t("actions.reportPerson")}
          </span>
          <span className="line-clamp-2 text-[11px] text-neutral-400 sm:text-xs">
            {t("actions.reportPersonDesc")}
          </span>
        </Link>

        <Link
          href="/directory"
          className="group relative flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 p-2.5 text-center transition-all hover:border-neutral-700 hover:bg-neutral-900 active:scale-[0.98]"
        >
          {profileCount > 0 && (
            <span className="absolute right-2 top-2 rounded-full bg-neutral-800 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-300">
              {profileCount}
            </span>
          )}
          <MagnifyingGlassIcon className="h-8 w-8 text-white sm:h-10 sm:w-10" />
          <span className="text-sm font-bold text-white sm:text-base">
            {t("actions.searchCatalog")}
          </span>
          <span className="line-clamp-2 text-[11px] text-neutral-400 sm:text-xs">
            {t("actions.searchCatalogDesc")}
          </span>
        </Link>

        <Link
          href="/centers"
          className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 p-2.5 text-center transition-all hover:border-neutral-700 hover:bg-neutral-900 active:scale-[0.98]"
        >
          <MapPinIcon className="h-8 w-8 text-white sm:h-10 sm:w-10" />
          <span className="text-sm font-bold text-white sm:text-base">
            {t("actions.nearbyCenters")}
          </span>
          <span className="line-clamp-2 text-[11px] text-neutral-400 sm:text-xs">
            {t("actions.nearbyCentersDesc")}
          </span>
        </Link>

        <Link
          href="/protocol"
          className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 p-2.5 text-center transition-all hover:border-neutral-700 hover:bg-neutral-900 active:scale-[0.98]"
        >
          <BookIcon className="h-8 w-8 text-white sm:h-10 sm:w-10" />
          <span className="text-sm font-bold text-white sm:text-base">
            {t("actions.guideProtocol")}
          </span>
          <span className="line-clamp-2 text-[11px] text-neutral-400 sm:text-xs">
            {t("actions.guideProtocolDesc")}
          </span>
        </Link>
      </div>

      <p className="mx-auto w-full max-w-md whitespace-pre-line text-center text-xs text-neutral-500 sm:max-w-lg sm:text-sm">
        {t("actions.offlineNotice")}
      </p>
    </div>
  );
}
