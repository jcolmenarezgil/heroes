"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useUserLocation } from "@/hooks/useUserLocation";
import { MapPinIcon, PhoneIcon, RefreshClockIcon } from "@/components/icons";
import {
    fetchHealthCentersSingleRadius,
    getLastKnownCache,
    HealthCenter,
    HealthCenterType,
    CachedDataEntry,
} from "@/services/healthCenters";

const RADIUS_CHIPS = [100, 300, 500, 1000, 3000, 5000];
const CENTER_TYPES: HealthCenterType[] = ["all", "hospital", "pharmacy", "clinic", "health"];

const formatRadius = (meters: number): string => {
    return meters >= 1000 ? `${meters / 1000} km` : `${meters} m`;
};

export default function HealthCentersPage() {
    const t = useTranslations("healthCenters");
    const { coordinates, permission, isLoading: isLocating, requestLocation, accuracy } = useUserLocation();

    const [centers, setCenters] = useState<HealthCenter[]>([]);
    const [cachedState, setCachedState] = useState<CachedDataEntry | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [activeRadius, setActiveRadius] = useState<number>(500);
    const [searchType, setSearchType] = useState<HealthCenterType>("all");
    const [networkFailed, setNetworkFailed] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        let active = true;
        getLastKnownCache().then((cached) => {
            if (!active || !cached) return;
            setCachedState(cached);
            setCenters((prev) => (prev.length === 0 ? cached.data : prev));
        });
        return () => {
            active = false;
        };
    }, []);

    const refreshCachedState = useCallback(async () => {
        const cached = await getLastKnownCache();
        if (cached) setCachedState(cached);
    }, []);

    const runSearch = useCallback(
        async (lat: number, lon: number, radius: number, type: HealthCenterType) => {
            setIsSearching(true);
            setNetworkFailed(false);

            const { centers: results, ok } = await fetchHealthCentersSingleRadius(lat, lon, radius, type);

            if (results.length > 0) {
                setCenters(results);
                refreshCachedState();
            } else {
                setCenters([]);
                if (!ok) {
                    const cached = await getLastKnownCache();
                    if (cached) setCenters(cached.data);
                }
                setNetworkFailed(!ok);
            }

            setHasSearched(true);
            setIsSearching(false);
        },
        [refreshCachedState]
    );

    const handleRadiusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const radius = Number(e.target.value);
        setActiveRadius(radius);
        if (coordinates) runSearch(coordinates.lat, coordinates.lon, radius, searchType);
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const type = e.target.value as HealthCenterType;
        setSearchType(type);
        if (coordinates) runSearch(coordinates.lat, coordinates.lon, activeRadius, type);
    };

    const typeBreakdown = (["hospital", "pharmacy", "clinic", "health"] as const)
        .map((type) => ({ type, count: centers.filter((c) => c.type === type).length }))
        .filter((entry) => entry.count > 0)
        .map((entry) => `${entry.count} ${t(`types.${entry.type}`)}`);

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-5">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">{t("title")}</h1>
                <p className="text-sm text-neutral-400">{t("subtitle")}</p>
            </div>

            {!coordinates ? (
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 shadow-xl text-xs">
                    {isLocating ? (
                        <div className="flex items-center justify-center gap-2 py-4 text-neutral-400">
                            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            {t("locating")}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 py-5 text-center">
                            <MapPinIcon className="h-8 w-8 text-neutral-500" />
                            <p className="text-neutral-400">
                                {permission === "denied" ? t("locationDenied") : t("enableLocation")}
                            </p>
                            <button
                                onClick={requestLocation}
                                className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-neutral-950 transition hover:bg-neutral-200"
                            >
                                {t("useMyLocation")}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-10">
                    {/* Card A: buscar centros de atención (70%) */}
                    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 shadow-xl text-xs md:col-span-7">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="font-medium text-neutral-200">{t("locationActive")}</span>
                            </div>
                            <button
                                onClick={requestLocation}
                                disabled={isSearching}
                                className="flex items-center gap-1.5 text-neutral-400 transition hover:text-white disabled:opacity-50"
                            >
                                <RefreshClockIcon className="h-3.5 w-3.5 text-white" />
                                {t("refetch")}
                            </button>
                        </div>

                        <div className="my-3 border-b border-neutral-800" />

                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                {isSearching ? (
                                    <div className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5">
                                        <svg className="animate-spin h-3.5 w-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        <div className="h-1 w-24 overflow-hidden rounded-full bg-neutral-800">
                                            <div className="h-full w-full animate-pulse bg-emerald-500" />
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => coordinates && runSearch(coordinates.lat, coordinates.lon, activeRadius, searchType)}
                                        className="rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-950 transition hover:bg-neutral-200"
                                    >
                                        {t("findCarePoints")}
                                    </button>
                                )}

                                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-neutral-400">{t("searchRadius")}</span>
                                        <select
                                            value={activeRadius}
                                            onChange={handleRadiusChange}
                                            disabled={isSearching}
                                            aria-label={t("searchRadius")}
                                            className="rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs font-medium text-white focus:outline-none"
                                        >
                                            {RADIUS_CHIPS.map((r) => (
                                                <option key={r} value={r} className="bg-neutral-900 text-white">
                                                    {formatRadius(r)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <span aria-hidden="true" className="text-neutral-600">
                                        |
                                    </span>

                                    <div className="flex items-center gap-1.5">
                                        <span className="text-neutral-400">{t("filterByType")}</span>
                                        <select
                                            value={searchType}
                                            onChange={handleTypeChange}
                                            disabled={isSearching}
                                            aria-label={t("filterByType")}
                                            className="rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs font-medium text-white focus:outline-none"
                                        >
                                            {CENTER_TYPES.map((type) => (
                                                <option key={type} value={type} className="bg-neutral-900 text-white">
                                                    {type === "all" ? t("filterAll") : t(`types.${type}`)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {isSearching && (
                                <p className="text-neutral-500">
                                    {t("scanningRadius", { radius: formatRadius(activeRadius) })}
                                </p>
                            )}

                            {!isSearching && hasSearched && centers.length > 0 && (
                                <div className="border-t border-neutral-800 pt-3">
                                    <p className="text-lg font-bold text-white">
                                        {t("summaryCount", {
                                            count: centers.length,
                                            radius: formatRadius(activeRadius),
                                        })}
                                    </p>
                                    {searchType === "all" && typeBreakdown.length > 0 && (
                                        <p className="mt-0.5 text-xs text-neutral-400">
                                            {typeBreakdown.join(" · ")}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card B: ubicación y datos locales (30%) */}
                    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 shadow-xl text-xs md:col-span-3">
                        <div className="space-y-1">
                            {accuracy != null && (
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-neutral-400">{t("precisionLabel")}</span>
                                    <span className="text-neutral-200">{t("precision", { accuracy })}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-neutral-400">{t("coordinates")}</span>
                                <span className="break-all font-mono text-neutral-200">
                                    {coordinates.lat.toFixed(4)}, {coordinates.lon.toFixed(4)}
                                </span>
                            </div>
                        </div>

                        <div className="my-3 border-b border-neutral-800" />

                        {cachedState ? (
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="font-medium text-neutral-200">
                                        {t("localCacheCount", { count: cachedState.data.length })}
                                    </span>
                                </div>
                                <p className="mt-0.5 text-neutral-500">
                                    {t("lastSync", {
                                        time: new Date(cachedState.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    })}
                                </p>
                            </div>
                        ) : (
                            <p className="text-neutral-500">{t("noLocalData")}</p>
                        )}
                    </div>
                </div>
            )}

            {networkFailed && (
                <div className="bg-amber-950/40 border border-amber-800/60 text-amber-200 p-3 rounded-md text-xs">
                    {t("networkDegraded")}
                </div>
            )}

            {centers.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/30">
                    <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-neutral-800 bg-neutral-950/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                        <span>{t("table.center")}</span>
                        <span className="text-right">{t("table.distance")}</span>
                    </div>
                    <div className="divide-y divide-neutral-800/60">
                        {centers.map((center) => (
                            <div
                                key={center.id}
                                className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-white">
                                        {center.name}
                                    </p>
                                    <div className="mt-0.5 flex min-w-0 items-center gap-x-3 text-xs text-neutral-400">
                                        {center.address && (
                                            <span className="flex min-w-0 items-center gap-1">
                                                <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                                                <span className="truncate">{center.address}</span>
                                            </span>
                                        )}
                                        {center.phone && (
                                            <a
                                                href={`tel:${center.phone}`}
                                                className="flex shrink-0 items-center gap-1 transition-colors hover:text-emerald-400"
                                            >
                                                <PhoneIcon className="h-3.5 w-3.5" />
                                                {center.phone}
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="whitespace-nowrap font-mono text-xs text-emerald-400">
                                        {center.distance < 1
                                            ? `${Math.round(center.distance * 1000)} m`
                                            : `${center.distance} km`}
                                    </p>
                                    <p className="mt-0.5 whitespace-nowrap text-xs text-neutral-400">
                                        {t(`types.${center.type}`)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {hasSearched && !isSearching && !networkFailed && centers.length === 0 && (
                <div className="p-8 border border-neutral-800 rounded-lg text-center space-y-3">
                    <p className="text-neutral-400 text-sm">
                        {t("emptyStateWithRadius", { radius: formatRadius(activeRadius) })}
                    </p>
                    <button
                        onClick={() => coordinates && runSearch(coordinates.lat, coordinates.lon, activeRadius, searchType)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-md text-xs font-medium"
                    >
                        {t("retryProgressive")}
                    </button>
                </div>
            )}
        </div>
    );
}
