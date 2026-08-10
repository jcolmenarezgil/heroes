"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useUserLocation } from "@/hooks/useUserLocation";
import {
    fetchHealthCentersSingleRadius,
    getLastKnownCache,
    HealthCenter,
    CachedDataEntry,
} from "@/services/healthCenters";

const AUTOMATIC_STEPS = [100, 300, 500];
const EXTENDED_STEPS = [1000, 3000, 5000];

const formatRadius = (meters: number): string => {
    return meters >= 1000 ? `${meters / 1000} km` : `${meters} m`;
};

export default function HealthCentersPage() {
    const t = useTranslations("healthCenters");
    const { coordinates, permission, isLoading: isLocating, requestLocation } = useUserLocation();

    const [centers, setCenters] = useState<HealthCenter[]>([]);
    const [cachedState, setCachedState] = useState<CachedDataEntry | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [currentScanRadius, setCurrentScanRadius] = useState<number | null>(null);
    const [activeRadius, setActiveRadius] = useState<number>(100);
    const [networkFailed, setNetworkFailed] = useState(false);

    useEffect(() => {
        getLastKnownCache().then((cached) => {
            if (cached) {
                setCachedState(cached);
                if (centers.length === 0) {
                    setCenters(cached.data);
                }
            }
        });
    }, []);

    const runProgressiveSearch = useCallback(async (lat: number, lon: number) => {
        setIsSearching(true);
        setNetworkFailed(false);
        let foundCenters: HealthCenter[] = [];

        for (const radius of AUTOMATIC_STEPS) {
            setCurrentScanRadius(radius);
            setActiveRadius(radius);

            const results = await fetchHealthCentersSingleRadius(lat, lon, radius);

            if (results.length > 0) {
                foundCenters = results;
                setCenters(results);
                break;
            }
        }

        if (foundCenters.length === 0) {
            setNetworkFailed(true);
            const cached = await getLastKnownCache();
            if (cached) {
                setCenters(cached.data);
            }
        }

        setCurrentScanRadius(null);
        setIsSearching(false);
    }, []);

    const handleManualSearch = async (radiusMeters: number) => {
        if (!coordinates) return;
        setIsSearching(true);
        setCurrentScanRadius(radiusMeters);
        setActiveRadius(radiusMeters);
        setNetworkFailed(false);

        const results = await fetchHealthCentersSingleRadius(coordinates.lat, coordinates.lon, radiusMeters);

        if (results.length > 0) {
            setCenters(results);
        } else {
            setNetworkFailed(true);
        }

        setCurrentScanRadius(null);
        setIsSearching(false);
    };

    useEffect(() => {
        if (coordinates) {
            runProgressiveSearch(coordinates.lat, coordinates.lon);
        }
    }, [coordinates, runProgressiveSearch]);

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-5">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">{t("title")}</h1>
                <p className="text-sm text-neutral-400">{t("subtitle")}</p>
            </div>

            {cachedState && (
                <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-3 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-neutral-300 font-medium">
                            {t("localCacheActive", { count: cachedState.data.length })}
                        </span>
                    </div>
                    <span className="text-neutral-500">
                        {t("lastSync", {
                            time: new Date(cachedState.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        })}
                    </span>
                </div>
            )}

            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-xs space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2 border-b border-neutral-800 pb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-neutral-400">{t("gpsLabel")}</span>
                        <span className={`font-semibold ${permission === "granted" ? "text-emerald-400" : "text-amber-400"}`}>
                            {permission.toUpperCase()}
                        </span>
                    </div>

                    {coordinates ? (
                        <span className="text-neutral-300 font-mono">
                            Lat: {coordinates.lat.toFixed(4)} | Lon: {coordinates.lon.toFixed(4)}
                        </span>
                    ) : (
                        <span className="text-amber-400">{t("noCoordinates")}</span>
                    )}

                    <button
                        onClick={requestLocation}
                        disabled={isLocating || isSearching}
                        className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded transition disabled:opacity-50"
                    >
                        {isLocating ? t("locating") : t("retryGps")}
                    </button>
                </div>

                {isSearching && currentScanRadius && (
                    <div className="space-y-2 py-1">
                        <div className="flex justify-between items-center text-emerald-400 font-medium">
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                {t("scanningZone", { radius: formatRadius(currentScanRadius) })}
                            </span>
                            <span>
                                {currentScanRadius === 100
                                    ? t("pass1")
                                    : currentScanRadius === 300
                                        ? t("pass2")
                                        : currentScanRadius === 500
                                            ? t("pass3")
                                            : t("extendedQuery")}
                            </span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-emerald-500 h-1.5 transition-all duration-500"
                                style={{
                                    width: currentScanRadius === 100 ? "33%" : currentScanRadius === 300 ? "66%" : "100%",
                                }}
                            />
                        </div>
                    </div>
                )}

                {!isSearching && coordinates && (
                    <div className="flex items-center justify-between pt-1">
                        <span className="text-neutral-400">
                            {t("currentRadius")} <strong className="text-white">{formatRadius(activeRadius)}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-neutral-500 text-[11px]">{t("extendedDemand")}</span>
                            {EXTENDED_STEPS.map((r) => (
                                <button
                                    key={r}
                                    onClick={() => handleManualSearch(r)}
                                    className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[11px]"
                                >
                                    {formatRadius(r)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {networkFailed && (
                <div className="bg-amber-950/40 border border-amber-800/60 text-amber-200 p-3 rounded-md text-xs">
                    {t("networkDegraded")}
                </div>
            )}

            {centers.length > 0 && (
                <div className="grid gap-3">
                    {centers.map((center) => (
                        <div key={center.id} className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg space-y-1 hover:border-neutral-700 transition">
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-white text-sm">{center.name}</h3>
                                <span className="text-xs bg-neutral-800 text-emerald-400 font-mono px-2 py-0.5 rounded">
                                    {center.distance < 1 ? `${Math.round(center.distance * 1000)} m` : `${center.distance} km`}
                                </span>
                            </div>
                            <p className="text-xs text-neutral-400 capitalize">{t("typeLabel")} {center.type}</p>
                            {center.address && <p className="text-xs text-neutral-400">📍 {center.address}</p>}
                            {center.phone && (
                                <a href={`tel:${center.phone}`} className="text-xs text-emerald-400 hover:underline block">
                                    📞 {center.phone}
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {!isSearching && centers.length === 0 && (
                <div className="p-8 border border-neutral-800 rounded-lg text-center space-y-3">
                    <p className="text-neutral-400 text-sm">
                        {t("emptyStateWithRadius", { radius: formatRadius(activeRadius) })}
                    </p>
                    <button
                        onClick={() => coordinates && runProgressiveSearch(coordinates.lat, coordinates.lon)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-md text-xs font-medium"
                    >
                        {t("retryProgressive")}
                    </button>
                </div>
            )}
        </div>
    );
}