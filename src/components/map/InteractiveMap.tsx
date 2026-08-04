"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import type { LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";

import { useRouter } from "@/i18n/navigation";
import { fetchNearbyHealthCenters } from "@/services/healthCenters";
import type { Coordinates, HealthCenter } from "@/types/map";

const customMarkerIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

function MapController({ center }: { center: Coordinates }) {
    const map = useMap();

    useEffect(() => {
        map.setView([center.latitude, center.longitude], map.getZoom());
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 200);

        return () => clearTimeout(timer);
    }, [center, map]);

    return null;
}

function LocationMarker({ onSelectCoords }: { onSelectCoords: (coords: Coordinates) => void }) {
    const [position, setPosition] = useState<L.LatLng | null>(null);

    useMapEvents({
        click(e: LeafletMouseEvent) {
            setPosition(e.latlng);
            onSelectCoords({ latitude: e.latlng.lat, longitude: e.latlng.lng });
        },
    });

    return position === null ? null : (
        <Marker position={position} icon={customMarkerIcon}>
            <Popup>Punto seleccionado para reporte</Popup>
        </Marker>
    );
}

export default function InteractiveMap({ userLocation }: { userLocation: Coordinates }) {
    const router = useRouter();
    const [centers, setCenters] = useState<HealthCenter[]>([]);
    const [selectedCoords, setSelectedCoords] = useState<Coordinates | null>(null);

    useEffect(() => {
        if (userLocation) {
            fetchNearbyHealthCenters(userLocation).then(setCenters);
        }
    }, [userLocation]);

    const handleCreateReportAtLocation = () => {
        if (!selectedCoords) return;
        router.push(`/create?lat=${selectedCoords.latitude}&lng=${selectedCoords.longitude}`);
    };

    return (
        <div className="relative h-[calc(100vh-12rem)] w-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
            <MapContainer
                center={[userLocation.latitude, userLocation.longitude]}
                zoom={14}
                scrollWheelZoom={true}
                className="h-full w-full z-0"
            >
                <MapController center={userLocation} />

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <LocationMarker onSelectCoords={setSelectedCoords} />

                {centers.map((center) => (
                    <Marker
                        key={center.id}
                        position={[center.location.latitude, center.location.longitude]}
                        icon={customMarkerIcon}
                    >
                        <Popup>
                            <div className="p-1 text-neutral-900">
                                <p className="font-bold text-sm">{center.name}</p>
                                <p className="text-xs text-neutral-600">{center.address}</p>
                                <span className="mt-1 inline-block rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-800">
                                    {center.type === "hospital" ? "Hospital" : "Centro Médico"}
                                </span>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {selectedCoords && (
                <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between rounded-lg border border-neutral-700 bg-neutral-900/95 p-4 backdrop-blur-md shadow-xl">
                    <div className="text-xs text-neutral-200">
                        <p className="font-semibold text-red-400">Punto seleccionado</p>
                        <p className="text-neutral-400 font-mono">
                            {selectedCoords.latitude.toFixed(4)}, {selectedCoords.longitude.toFixed(4)}
                        </p>
                    </div>
                    <button
                        onClick={handleCreateReportAtLocation}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-500"
                    >
                        Crear Reporte Aquí
                    </button>
                </div>
            )}
        </div>
    );
}