"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useUserLocation } from "@/hooks/useUserLocation";
import { listProfiles } from "@/lib/api-client";
import type { ProfileDTO } from "@/types/profile";

const InteractiveMap = dynamic(
    () => import("@/components/map/InteractiveMap"),
    { ssr: false }
);

export default function MapPage() {
    const t = useTranslations("map");
    const { location, error: locationError, isLoading: isLocating, requestLocation } = useUserLocation();

    const [profiles, setProfiles] = useState<ProfileDTO[]>([]);
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchMapProfiles() {
            try {
                setIsLoadingProfiles(true);
                const response = await listProfiles({ limit: 100 });

                if (isMounted) {
                    // Soporta respuesta array directo o envuelta en objeto (items / profiles / data)
                    const list: ProfileDTO[] = Array.isArray(response)
                        ? response
                        : "items" in response && Array.isArray(response.items)
                            ? response.items
                            : "profiles" in response && Array.isArray(response.profiles)
                                ? response.profiles
                                : [];

                    const validProfiles = list.filter(
                        (p: ProfileDTO) => p.latitude !== null && p.longitude !== null
                    );
                    setProfiles(validProfiles);
                    setApiError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setApiError(
                        err instanceof Error ? err.message : "Error al cargar reportes en el mapa"
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoadingProfiles(false);
                }
            }
        }

        fetchMapProfiles();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <section className="flex flex-col space-y-4">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-xl font-bold tracking-tight text-neutral-100 sm:text-2xl">
                        {t("title")}
                    </h1>
                    <p className="text-xs text-neutral-400 sm:text-sm">
                        {t("subtitle")}
                    </p>
                </div>

                {!location && (
                    <button
                        onClick={requestLocation}
                        disabled={isLocating}
                        className="self-start rounded-lg bg-neutral-800 px-3.5 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-700 disabled:opacity-50 sm:self-auto transition-colors"
                    >
                        {isLocating ? t("gettingLocation") : t("myLocation")}
                    </button>
                )}
            </header>

            {(locationError || apiError) && (
                <div className="rounded-md border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">
                    {locationError || apiError}
                </div>
            )}

            <InteractiveMap
                userLocation={location}
                profiles={profiles}
            />
        </section>
    );
}