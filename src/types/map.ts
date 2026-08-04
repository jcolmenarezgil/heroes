export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface HealthCenter {
    id: string;
    name: string;
    type: "hospital" | "clinic" | "first_aid";
    location: Coordinates;
    address: string;
    distanceInMeters?: number;
}

export interface MapViewProps {
    initialCenter?: Coordinates;
    healthCenters: HealthCenter[];
    onSelectCenter?: (center: HealthCenter) => void;
    onSelectLocation?: (coords: Coordinates) => void;
    isLoading?: boolean;
}