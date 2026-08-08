"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSync } from "@/components/providers/SyncProvider";
import { searchCachedProfiles } from "@/lib/profiles-cache";
import ProfileSearchList from "@/components/profiles/ProfileSearchList";
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  AcademicCapIcon,
  InformationCircleIcon,
} from "@/components/icons";

export default function HomePage() {
  const t = useTranslations("home");
  const tConnectivity = useTranslations("connectivity");
  const { isOnline, lastSync } = useSync();

  const [activeTab, setActiveTab] = useState<"actions" | "search">("actions");
  const [profileCount, setProfileCount] = useState(0);

  // Mantiene sincronizado el número total de registros activos para el indicador
  useEffect(() => {
    let isSubscribed = true;
    searchCachedProfiles("").then((res) => {
      if (isSubscribed) setProfileCount(res.length);
    });
    return () => {
      isSubscribed = false;
    };
  }, [lastSync]);

  return (
    <div className="flex flex-col space-y-4 pb-6">
      {/* 1. Header principal con modo Offline */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-0.5 text-xs text-neutral-400 sm:text-sm">
            {t("subtitle")}
          </p>
        </div>

        {!isOnline && (
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            {tConnectivity("offline")}
          </div>
        )}
      </div>

      {/* 2. Switcher de Modo */}
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-1">
        <button
          onClick={() => setActiveTab("actions")}
          className={`rounded-lg py-2 text-xs font-bold transition-all ${activeTab === "actions"
              ? "bg-neutral-800 text-white shadow-sm"
              : "text-neutral-400 hover:text-white"
            }`}
        >
          {t("tabs.quickActions")}
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={`rounded-lg py-2 text-xs font-bold transition-all ${activeTab === "search"
              ? "bg-neutral-800 text-white shadow-sm"
              : "text-neutral-400 hover:text-white"
            }`}
        >
          {t("tabs.searchDirectory")} ({profileCount})
        </button>
      </div>

      {/* 3. Panel 1: Grid de Botones Rápidos en 2 Columnas para Móviles */}
      {activeTab === "actions" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* Acción Principal Prominente (Rojo/Acción Urgente) */}
            <Link
              href="/create"
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-rose-900/20 to-neutral-900 p-3.5 transition-all hover:border-rose-500/60 active:scale-[0.98] sm:p-5"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-rose-600 p-2 text-white shadow-md transition-transform group-hover:scale-105 sm:p-2.5">
                  <UserPlusIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-rose-300 sm:text-[10px]">
                  {t("actions.urgent")}
                </span>
              </div>
              <div className="mt-3 sm:mt-4">
                <h2 className="text-sm font-bold text-white group-hover:text-rose-200 sm:text-base">
                  {t("actions.reportPerson")}
                </h2>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-neutral-400 sm:text-xs">
                  {t("actions.reportPersonDesc")}
                </p>
              </div>
            </Link>

            {/* Búsqueda Rápida */}
            <button
              onClick={() => setActiveTab("search")}
              className="group flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5 text-left transition-all hover:border-neutral-700 hover:bg-neutral-900 active:scale-[0.98] sm:p-5"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-neutral-800 p-2 text-white transition-transform group-hover:scale-105 sm:p-2.5">
                  <MagnifyingGlassIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
              <div className="mt-3 sm:mt-4">
                <h2 className="text-sm font-bold text-white sm:text-base">
                  {t("actions.searchCatalog")}
                </h2>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-neutral-400 sm:text-xs">
                  {t("actions.searchCatalogDesc")}
                </p>
              </div>
            </button>

            {/* Puntos de Atención / Módulos */}
            <Link
              href="/centers"
              className="group flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5 transition-all hover:border-neutral-700 hover:bg-neutral-900 active:scale-[0.98] sm:p-5"
            >
              <div className="w-fit rounded-lg bg-neutral-800 p-2 text-white transition-transform group-hover:scale-105 sm:p-2.5">
                <MapPinIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="mt-3 sm:mt-4">
                <h2 className="text-sm font-bold text-white sm:text-base">
                  {t("actions.nearbyCenters")}
                </h2>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-neutral-400 sm:text-xs">
                  {t("actions.nearbyCentersDesc")}
                </p>
              </div>
            </Link>

            {/* Guía / Protocolo de Respuesta */}
            <Link
              href="/protocol"
              className="group flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5 transition-all hover:border-neutral-700 hover:bg-neutral-900 active:scale-[0.98] sm:p-5"
            >
              <div className="w-fit rounded-lg bg-neutral-800 p-2 text-white transition-transform group-hover:scale-105 sm:p-2.5">
                <AcademicCapIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="mt-3 sm:mt-4">
                <h2 className="text-sm font-bold text-white sm:text-base">
                  {t("actions.guideProtocol")}
                </h2>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-neutral-400 sm:text-xs">
                  {t("actions.guideProtocolDesc")}
                </p>
              </div>
            </Link>
          </div>

          {/* Banner Infobar Inferior */}
          <div className="flex items-center gap-2.5 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 text-[11px] text-neutral-400 sm:text-xs">
            <InformationCircleIcon className="h-4 w-4 shrink-0 text-neutral-400 sm:h-5 sm:w-5" />
            <p>{t("actions.offlineNotice")}</p>
          </div>
        </div>
      )}

      {/* 4. Panel 2: Componente Reutilizable de Búsqueda */}
      {activeTab === "search" && <ProfileSearchList />}
    </div>
  );
}