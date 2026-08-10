"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSync } from "@/components/providers/SyncProvider";
import { searchCachedProfiles } from "@/lib/profiles-cache";
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  BookIcon,
} from "@/components/icons";

export default function HomePage() {
  const t = useTranslations("home");
  const tConnectivity = useTranslations("connectivity");
  const { isOnline, lastSync } = useSync();

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

      {/* 2. Cuadrícula de Acciones Rápidas (azulejos cuadrados) */}
      <div className="mx-auto mt-2 w-full max-w-md grid grid-cols-2 gap-3 sm:mt-3 sm:max-w-lg sm:gap-4">
        {/* Acción Principal Prominente (Rojo/Acción Urgente) */}
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

        {/* Búsqueda del Directorio */}
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

        {/* Puntos de Atención / Módulos */}
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

        {/* Guía / Protocolo de Respuesta */}
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

      {/* Aviso informativo (solo texto) */}
      <p className="mx-auto w-full max-w-md whitespace-pre-line text-center text-xs text-neutral-500 sm:max-w-lg sm:text-sm">
        {t("actions.offlineNotice")}
      </p>
    </div>
  );
}
