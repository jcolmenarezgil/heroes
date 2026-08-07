//src/lib/validations/profile.ts
import { z } from "zod";

export const profileStatusSchema = z.enum(["active", "found", "deceased"]);

export const profileSchema = z.object({
    name: z.string().trim().min(1, "nameRequired").max(200),
    lastKnownLocation: z
        .string()
        .trim()
        .min(3, "locationRequired")
        .max(500),

    // Coordenadas opcionales para la geolocalización
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),

    photoUrl: z
        .string()
        .max(2000)
        .regex(/^(\/api\/photos\/[0-9a-f-]{36}|https?:\/\/.+)$/i)
        .nullish(),
    photoPath: z.string().max(500).nullish(),
    isMinor: z.boolean().default(false),
    contactPhone: z.string().trim().min(1).max(50).nullish(),
    notes: z.string().max(5000).nullish(),
    status: profileStatusSchema.default("active"),
});

export const createProfileSchema = z.object({
    name: z.string().trim().min(1).max(200),
    photoUrl: z
        .string()
        .max(2000)
        .regex(/^(\/api\/photos\/[0-9a-f-]{36}|https?:\/\/.+)$/i)
        .nullish(),
    photoPath: z.string().max(500).nullish(),
    isMinor: z.boolean().default(false),
    lastKnownLocation: z.string().trim().min(3).max(500),

    // Coordenadas para geolocalización
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),

    status: profileStatusSchema.default("active"),
    contactPhone: z.string().trim().min(1).max(50).nullish(),
    notes: z.string().max(5000).nullish(),
});

export const updateProfileSchema = createProfileSchema.partial();

export const listProfilesQuerySchema = z.object({
    q: z.string().trim().min(1).max(200).optional(),
    status: profileStatusSchema.optional(),
    createdBy: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(200).default(20),
    page: z.coerce.number().int().min(1).default(1),
});

export const uuidParamSchema = z.string().uuid();

export type ProfileInput = z.infer<typeof profileSchema>;
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ListProfilesQuery = z.infer<typeof listProfilesQuerySchema>;