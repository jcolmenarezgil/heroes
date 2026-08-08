"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useHealthCentersStore } from "@/store/useHealthCentersStore";
import { MapPinIcon, PhoneIcon } from "@/components/icons";

export default function HealthCentersPage() {
    const t = useTranslations("healthCenters");
    const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    const { startStreaming, getSortedCenters, isStreaming } = useHealthCentersStore();

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationError(t("errors.geoNotSupported"));
            const fallbackCoords = { lat: 10.2541, lon: -67.9531 };
            setUserCoords(fallbackCoords);
            startStreaming(fallbackCoords.lat, fallbackCoords.lon);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                };
                setUserCoords(coords);
                startStreaming(coords.lat, coords.lon);
            },
            (err) => {
                console.warn("[HealthCenters] Error reading location:", err.message);
                setLocationError(t("errors.locationFailed"));
                const fallbackCoords = { lat: 10.2541, lon: -67.9531 };
                setUserCoords(fallbackCoords);
                startStreaming(fallbackCoords.lat, fallbackCoords.lon);
            },
            { enableHighAccuracy: true, timeout: 20000 }
        );
    }, [startStreaming, t]);

    const centers = userCoords ? getSortedCenters(userCoords.lat, userCoords.lon) : [];

    const getBadgeColor = (type: string) => {
        switch (type) {
            case "hospital":
                return "bg-rose-500/20 text-rose-400 border-rose-500/30";
            case "pharmacy":
                return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
            case "clinic":
                return "bg-blue-500/20 text-blue-400 border-blue-500/30";
            default:
                return "bg-amber-500/20 text-amber-400 border-amber-500/30";
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "hospital":
                return t("types.hospital");
            case "clinic":
                return t("types.clinic");
            case "pharmacy":
                return t("types.pharmacy");
            default:
                return t("types.health");
        }
    };

    return (
        <div className="flex flex-col space-y-4 pb-12">
            <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    {t("title")}
                </h1>
                <p className="mt-1 text-xs text-neutral-400 sm:text-sm">
                    {t("subtitle")}
                </p>
            </div>

            {locationError && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-400">
                    {locationError}
                </div>
            )}

            {isStreaming && centers.length > 0 && (
                <div className="flex items-center gap-2 text-[11px] text-neutral-400 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    {t("searching")}
                </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {centers.map((center) => (
                    <div
                        key={center.id}
                        className="flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 transition-all hover:border-neutral-700"
                    >
                        <div>
                            <div className="flex items-start justify-between gap-2">
                                <span
                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getBadgeColor(
                                        center.type
                                    )}`}
                                >
                                    {getTypeLabel(center.type)}
                                </span>
                                <span className="text-xs font-semibold text-neutral-400">
                                    {center.distance} km
                                </span>
                            </div>

                            <h2 className="mt-2 text-base font-bold text-white">{center.name}</h2>

                            {center.address && (
                                <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-400">
                                    <MapPinIcon className="h-4 w-4 shrink-0 text-neutral-500" />
                                    <span className="line-clamp-1">{center.address}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-neutral-800/80 pt-3">
                            {center.phone ? (
                                <a
                                    href={`tel:${center.phone}`}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:underline"
                                >
                                    <PhoneIcon className="h-3.5 w-3.5" />
                                    {center.phone}
                                </a>
                            ) : (
                                <span className="text-[11px] text-neutral-500">{t("noPhone")}</span>
                            )}

                            <Link
                                href={`/map?lat=${center.lat}&lng=${center.lon}&zoom=15`}
                                className="text-xs font-medium text-blue-400 hover:underline"
                            >
                                {t("viewOnMap")}
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {isStreaming && centers.length === 0 && (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-neutral-400">
                    <span className="h-2 w-2 animate-ping rounded-full bg-rose-500" />
                    {t("loadingRealtime")}
                </div>
            )}

            {!isStreaming && centers.length === 0 && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-8 text-center text-xs text-neutral-400">
                    {t("emptyState")}
                </div>
            )}
        </div>
    );
}