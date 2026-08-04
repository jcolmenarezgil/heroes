"use client";

import { useState, useCallback } from "react";
import type { Coordinates } from "@/types/map";

interface UseUserLocationReturn {
    location: Coordinates | null;
    error: string | null;
    isLoading: boolean;
    requestLocation: () => void;
}

export function useUserLocation(): UseUserLocationReturn {
    const [location, setLocation] = useState<Coordinates | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const requestLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your device");
            return;
        }

        setIsLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setIsLoading(false);
            },
            (geoError) => {
                let msg = "Could not retrieve location";
                if (geoError.code === geoError.PERMISSION_DENIED) {
                    msg = "Location permission denied";
                } else if (geoError.code === geoError.TIMEOUT) {
                    msg = "Location request timed out";
                }
                setError(msg);
                setIsLoading(false);
            },
            {
                enableHighAccuracy: false, 
                timeout: 10000, 
                maximumAge: 60000, 
            }
        );
    }, []);

    return { location, error, isLoading, requestLocation };
}