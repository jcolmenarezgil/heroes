//src/lib/validations/profile.ts
import { z } from "zod";

export const profileStatusSchema = z.enum(["active", "found", "deceased"]);

export const profileSchema = z.object({
    id: z.string().uuid().optional(),
    user_id: z.string().uuid().optional(),
    name: z.string().trim().min(1),
    photo_url: z
        .string()
        .regex(/^(\/api\/photos\/[0-9a-f-]{36}|https?:\/\/.+)$/i)
        .nullable()
        .optional(),
    last_known_location: z.string().trim().min(1),
    status: z.enum(["active", "found", "inactive"]).default("active"),
    contact_phone: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    // Acepta booleano o el timestamp retornado por PostgreSQL
    verified: z.union([z.boolean(), z.string()]).nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    is_minor: z.boolean().default(false),
    photo_path: z.string().nullable().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    created_by: z.string().optional(),
    updated_by: z.string().optional(),
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