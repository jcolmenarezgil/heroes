"use client";

import { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Circle,
    Popup,
    Marker,
    useMap,
    useMapEvents,
} from "react-leaflet";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import L from "leaflet";
import type { ProfileDTO } from "@/types/profile";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

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
    onSelectLocation?: (coords: { lat: number; lng: number } | null) => void;
    onCreateReport?: (coords: { lat: number; lng: number }) => void;
}

function RecenterMap({ center, zoom = 15 }: { center: [number, number]; zoom?: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom, { duration: 1.2 });
    }, [center, zoom, map]);
    return null;
}

function MapClickHandler({
    onPointSelect,
}: {
    onPointSelect: (coords: { lat: number; lng: number }) => void;
}) {
    useMapEvents({
        click(e) {
            onPointSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    return null;
}

export default function InteractiveMap({
    userLocation,
    focusLocation,
    defaultCenter = [10.233, -67.983],
    onSelectLocation,
    onCreateReport,
}: InteractiveMapProps) {
    const t = useTranslations("map");
    const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(null);

    const handleSelectPoint = (coords: { lat: number; lng: number }) => {
        setSelectedPoint(coords);
        if (onSelectLocation) {
            onSelectLocation(coords);
        }
    };

    const handleUnlinkPoint = () => {
        setSelectedPoint(null);
        if (onSelectLocation) {
            onSelectLocation(null);
        }
    };

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
                <MapClickHandler onPointSelect={handleSelectPoint} />

                {selectedPoint && (
                    <Marker position={[selectedPoint.lat, selectedPoint.lng]}>
                        <Popup>
                            <div className="flex flex-col gap-2.5 p-1 rounded-md bg-neutral-900 text-neutral-100 border border-neutral-800 text-center min-w-[170px]">
                                <div>
                                    <p className="font-bold text-xs text-white">{t("selectedPoint")}</p>
                                    <p className="text-[11px] text-neutral-300 mt-0.5 font-mono">
                                        {selectedPoint.lat.toFixed(4)}, {selectedPoint.lng.toFixed(4)}
                                    </p>
                                </div>

                                {onCreateReport ? (
                                    <button
                                        onClick={() => onCreateReport(selectedPoint)}
                                        className="w-full rounded-lg bg-sky-400 px-3 py-1.5 text-center text-xs font-semibold text-neutral-950 hover:bg-sky-300 transition-colors focus:ring-2 focus:ring-sky-400 focus:outline-none"
                                    >
                                        {t("createReportHere")}
                                    </button>
                                ) : (
                                    <Link
                                        href={{
                                            pathname: "/create",
                                            query: {
                                                lat: selectedPoint.lat.toString(),
                                                lng: selectedPoint.lng.toString(),
                                            },
                                        }}
                                        className="w-full rounded-lg bg-sky-400 px-3 py-1.5 text-center text-xs font-semibold text-neutral-950 hover:bg-sky-300 transition-colors inline-block focus:ring-2 focus:ring-sky-400 focus:outline-none"
                                    >
                                        {t("createReportHere")}
                                    </Link>
                                )}

                                <button
                                    onClick={handleUnlinkPoint}
                                    className="text-[11px] text-neutral-300 hover:text-white underline underline-offset-2 transition-colors py-0.5"
                                >
                                    {t("unlinkCoordinates")}
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                )}

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
                            <div className="p-2 rounded-md bg-neutral-900 text-neutral-100 border border-neutral-800 text-center">
                                <p className="font-bold text-xs text-neutral-100">{t("coverageSector")}</p>
                                <p className="text-[11px] text-neutral-300">
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