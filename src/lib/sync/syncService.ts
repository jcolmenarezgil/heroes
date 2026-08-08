import { removeFromOutbox, getPendingOutboxItems } from "@/lib/db/indexedDB";
import { createProfile } from "@/lib/api-client";

export interface RawPersonPayload {
    name?: string;
    last_known_location?: string;
    lastKnownLocation?: string;
    status?: string;
    contact_phone?: string | null;
    contactPhone?: string | null;
    notes?: string | null;
    is_minor?: boolean;
    isMinor?: boolean;
    photo_url?: string | null;
    photoUrl?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
}

export async function processSyncQueue() {
    const pendingItems = await getPendingOutboxItems();

    for (const item of pendingItems) {
        const rawData = (item.payload || item) as RawPersonPayload;

        const name = rawData.name;
        const lastKnownLocation = rawData.last_known_location || rawData.lastKnownLocation;

        // Omitir registros corruptos que no cumplen con los requerimientos mínimos
        if (!name || !lastKnownLocation) {
            console.error(`Elemento outbox ${item.id} omitido: falta 'name' o 'lastKnownLocation'`);
            continue;
        }

        // Normalización del estado según el tipo admitido por el cliente API
        const rawStatus = rawData.status;
        const status: "active" | "found" | "deceased" =
            rawStatus === "found" || rawStatus === "deceased" ? rawStatus : "active";

        const formattedPerson = {
            name,
            lastKnownLocation,
            status,
            isMinor: rawData.is_minor ?? rawData.isMinor ?? false,
            contactPhone: rawData.contact_phone || rawData.contactPhone || null,
            notes: rawData.notes || null,
            photoUrl: rawData.photo_url || rawData.photoUrl || null,
            latitude: rawData.latitude ? Number(rawData.latitude) : null,
            longitude: rawData.longitude ? Number(rawData.longitude) : null,
        };

        try {
            await createProfile(formattedPerson);
            await removeFromOutbox(item.id);
        } catch (error) {
            console.error(`Error procesando elemento outbox ${item.id}:`, error);
            break;
        }
    }
}