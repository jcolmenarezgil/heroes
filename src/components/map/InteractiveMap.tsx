"use client";

import { useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { ProfileDTO } from "@/types/profile";
import "leaflet/dist/leaflet.css";

const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const selectedIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface InteractiveMapProps {
    userLocation?: { latitude: number; longitude: number } | null;
    profiles?: ProfileDTO[];
    defaultCenter?: [number, number];
}

function MapClickListener({
    onLocationSelect,
}: {
    onLocationSelect: (coords: { lat: number; lng: number }) => void;
}) {
    useMapEvents({
        click(e) {
            onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    return null;
}

export default function InteractiveMap({
    userLocation,
    profiles = [],
    defaultCenter = [10.233, -67.983],
}: InteractiveMapProps) {
    const router = useRouter();
    const [selectedCoords, setSelectedCoords] = useState<{
        lat: number;
        lng: number;
    } | null>(null);

    const centerPosition: [number, number] = userLocation
        ? [userLocation.latitude, userLocation.longitude]
        : defaultCenter;

    const handleCreateReport = () => {
        if (!selectedCoords) return;
        router.push(`/create?lat=${selectedCoords.lat.toFixed(6)}&lng=${selectedCoords.lng.toFixed(6)}`);
    };

    return (
        <div className="relative flex flex-col space-y-3">
            <div className="relative h-[calc(100dvh-18rem)] w-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
                <MapContainer
                    center={centerPosition}
                    zoom={14}
                    scrollWheelZoom={true}
                    className="h-full w-full z-0"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapClickListener
                        onLocationSelect={(coords) => setSelectedCoords(coords)}
                    />

                    {/* 1. Marcador de selección manual */}
                    {selectedCoords && (
                        <Marker
                            position={[selectedCoords.lat, selectedCoords.lng]}
                            icon={selectedIcon}
                        >
                            <Popup>
                                <div className="p-1 space-y-2 text-center text-neutral-900">
                                    <p className="font-semibold text-xs">Punto Seleccionado</p>
                                    <button
                                        onClick={handleCreateReport}
                                        className="w-full rounded bg-red-600 px-2 py-1 text-xs font-bold text-white hover:bg-red-700 transition-colors"
                                    >
                                        + Agregar persona desaparecida aquí
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* 2. Marcadores de perfiles registrados */}
                    {profiles.map((profile) => {
                        if (profile.latitude === null || profile.longitude === null)
                            return null;

                        return (
                            <Marker
                                key={profile.id}
                                position={[profile.latitude, profile.longitude]}
                                icon={defaultIcon}
                            >
                                <Popup>
                                    <div className="p-1 space-y-1 text-neutral-900">
                                        <h3 className="font-bold text-sm">{profile.name}</h3>
                                        <p className="text-xs text-neutral-600">
                                            Estado:{" "}
                                            <span className="font-semibold uppercase">
                                                {profile.status}
                                            </span>
                                        </p>
                                        <p className="text-xs text-neutral-500">
                                            {profile.lastKnownLocation}
                                        </p>
                                        <Link
                                            href={`/p/${profile.id}`}
                                            className="inline-block text-xs text-red-600 font-semibold underline mt-1"
                                        >
                                            Ver detalles
                                        </Link>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>

            {selectedCoords && (
                <div className="flex items-center justify-between rounded-lg border border-red-900/50 bg-red-950/40 p-3 text-neutral-200">
                    <div className="text-xs">
                        <span className="font-semibold text-red-400">Punto fijado:</span>{" "}
                        {selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}
                    </div>
                    <button
                        onClick={handleCreateReport}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition-colors"
                    >
                        + Reportar en esta ubicación
                    </button>
                </div>
            )}
        </div>
    );
}