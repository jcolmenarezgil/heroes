"use client";

import dynamic from "next/dynamic";
import { useUserLocation } from "@/hooks/useUserLocation";

const InteractiveMap = dynamic(
    () => import("@/components/map/InteractiveMap"),
    { ssr: false }
);

export default function MapPage() {
    const { location, error, isLoading, requestLocation } = useUserLocation();

    return (
        <section className="space-y-4 p-4">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-neutral-100">Mapa de Emergencias</h1>
                    <p className="text-xs text-neutral-400">
                        Centros médicos cercanos y selección de puntos de paradero
                    </p>
                </div>
                {!location && (
                    <button
                        onClick={requestLocation}
                        disabled={isLoading}
                        className="rounded-md bg-neutral-800 px-3 py-1.5 text-xs text-neutral-200 hover:bg-neutral-700"
                    >
                        {isLoading ? "Obteniendo ubicación..." : "Mi Ubicación"}
                    </button>
                )}
            </header>

            {error && (
                <div className="rounded-md border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">
                    {error}
                </div>
            )}

            {location ? (
                <InteractiveMap userLocation={location} />
            ) : (
                <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 text-center p-6">
                    <p className="text-sm text-neutral-400">
                        Activa tu ubicación para cargar los centros médicos y navegar por el mapa.
                    </p>
                    <button
                        onClick={requestLocation}
                        className="mt-3 rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500"
                    >
                        Permitir Ubicación
                    </button>
                </div>
            )}
        </section>
    );
}