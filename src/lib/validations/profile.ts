import { z } from "zod";

export const profileSchema = z.object({
    name: z.string().min(1, "nameRequired"),
    lastKnownLocation: z.string().min(1, "locationRequired"),

    // Coordenadas opcionales para la geolocalización
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),

    photoUrl: z.string().nullable().optional(),
    contactPhone: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    status: z.enum(["active", "found", "deceased"]).default("active"),
});

export const profileStatusSchema = z.enum(["active", "found", "deceased"]);

export const createProfileSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    lastKnownLocation: z.string().min(1, "La ubicación es requerida"),
    status: z.enum(["active", "found", "deceased"]),
    photoUrl: z.string().nullable().optional(),
    contactPhone: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
});

export const updateProfileSchema = createProfileSchema.partial();

export const listProfilesQuerySchema = z.object({
    q: z.string().trim().min(1).max(200).optional(),
    status: profileStatusSchema.optional(),
    limit: z.coerce.number().int().min(1).max(200).default(20),
    page: z.coerce.number().int().min(1).default(1),
});

export const uuidParamSchema = z.string().uuid();

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ListProfilesQuery = z.infer<typeof listProfilesQuerySchema>;
