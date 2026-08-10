"use client";

import { useState, useEffect, useCallback } from "react";

export type PermissionStatus = "prompt" | "granted" | "denied" | "unsupported";

export interface UserLocationState {
    coordinates: { lat: number; lon: number } | null;
    location: { latitude: number; longitude: number; accuracy?: number } | null;
    accuracy: number | null;
    permission: PermissionStatus;
    isLoading: boolean;
    error: string | null;
}

export function useUserLocation() {
    const [state, setState] = useState<Omit<UserLocationState, "location" | "coordinates">>({
        accuracy: null,
        permission: "prompt",
        isLoading: true,
        error: null,
    });

    const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

    const requestLocation = useCallback(() => {
        if (!("geolocation" in navigator)) {
            setState((prev) => ({
                ...prev,
                permission: "unsupported",
                isLoading: false,
                error: "Geolocation is not supported by this browser.",
            }));
            return;
        }

        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                });
                setState({
                    accuracy: position.coords.accuracy,
                    permission: "granted",
                    isLoading: false,
                    error: null,
                });
            },
            (err) => {
                let errorMessage = "Failed to retrieve location.";
                const perm: PermissionStatus = "denied";

                if (err.code === err.PERMISSION_DENIED) {
                    errorMessage = "Location permission denied by user.";
                } else if (err.code === err.POSITION_UNAVAILABLE) {
                    errorMessage = "Location information is unavailable.";
                } else if (err.code === err.TIMEOUT) {
                    errorMessage = "Location request timed out.";
                }

                setCoords(null);
                setState({
                    accuracy: null,
                    permission: perm,
                    isLoading: false,
                    error: errorMessage,
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            }
        );
    }, []);

    useEffect(() => {
        if ("permissions" in navigator) {
            navigator.permissions.query({ name: "geolocation" }).then((result) => {
                setState((prev) => ({ ...prev, permission: result.state as PermissionStatus }));
                result.onchange = () => {
                    setState((prev) => ({ ...prev, permission: result.state as PermissionStatus }));
                };
            });
        }
        // Kick off the initial geolocation request on mount. The request itself
        // is asynchronous; the sync state updates inside it are intentional.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        requestLocation();
    }, [requestLocation]);

    const location = coords
        ? {
            latitude: coords.lat,
            longitude: coords.lon,
            ...(state.accuracy !== null ? { accuracy: state.accuracy } : {}),
        }
        : null;

    return {
        ...state,
        coordinates: coords,
        location,
        requestLocation,
        retryLocation: requestLocation,
    };
}