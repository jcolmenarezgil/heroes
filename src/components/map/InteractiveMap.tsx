"use client";

import { useEffect } from "react";
import {
    MapContainer,
    TileLayer,
    Circle,
    Popup,
    useMap,
} from "react-leaflet";
import { useTranslations } from "next-intl";
import type { ProfileDTO } from "@/types/profile";
import "leaflet/dist/leaflet.css";

export interface FocusLocation {
    lat: number;
    lng: number;
    zoom?: number;
    radiusInMeters?: number;
}

interface InteractiveMapProps {
    userLocation?: { latitude: number; longitude: number; accuracy?: number } | null;
    focusLocation?: FocusLocation | null;
    profiles?: ProfileDTO[];
    defaultCenter?: [number, number];
}

function RecenterMap({ center, zoom = 15 }: { center: [number, number]; zoom?: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom, { duration: 1.2 });
    }, [center, zoom, map]);
    return null;
}

export default function InteractiveMap({
    userLocation,
    focusLocation,
    defaultCenter = [10.233, -67.983],
}: InteractiveMapProps) {
    const t = useTranslations("map");

    const centerPosition: [number, number] = focusLocation
        ? [focusLocation.lat, focusLocation.lng]
        : userLocation
            ? [userLocation.latitude, userLocation.longitude]
            : defaultCenter;

    const activeZoom = focusLocation?.zoom ?? 13.5;
    const targetRadius = focusLocation?.radiusInMeters ?? 900;

    return (
        <div className="relative h-[calc(100dvh-18rem)] w-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
            <MapContainer
                center={centerPosition}
                zoom={activeZoom}
                scrollWheelZoom={true}
                className="h-full w-full z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <RecenterMap center={centerPosition} zoom={activeZoom} />

                {focusLocation && (
                    <Circle
                        center={[focusLocation.lat, focusLocation.lng]}
                        radius={targetRadius}
                        pathOptions={{
                            color: "#2563eb",
                            fillColor: "#3b82f6",
                            fillOpacity: 0.18,
                            weight: 2,
                            dashArray: "6, 8",
                        }}
                    >
                        <Popup>
                            <div className="p-1 text-center text-neutral-900">
                                <p className="font-bold text-xs">{t("coverageSector")}</p>
                                <p className="text-[10px] text-neutral-600">
                                    {t("coverageRadius", { radius: (targetRadius / 1000).toFixed(1) })}
                                </p>
                            </div>
                        </Popup>
                    </Circle>
                )}

                {userLocation && (
                    <>
                        <Circle
                            center={[userLocation.latitude, userLocation.longitude]}
                            radius={userLocation.accuracy ?? 800}
                            pathOptions={{
                                color: "#10b981",
                                fillColor: "#34d399",
                                fillOpacity: 0.12,
                                stroke: false,
                            }}
                        />
                        <Circle
                            center={[userLocation.latitude, userLocation.longitude]}
                            radius={25}
                            pathOptions={{
                                color: "#ffffff",
                                fillColor: "#10b981",
                                fillOpacity: 0.9,
                                weight: 2,
                            }}
                        />
                    </>
                )}
            </MapContainer>
        </div>
    );
}