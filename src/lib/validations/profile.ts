import { z } from "zod";

export const profileStatusSchema = z.enum(["active", "found", "deceased"]);

export const createProfileSchema = z.object({
    name: z.string().trim().min(1).max(200),
    photoUrl: z.string().url().max(2000).nullish(),
    lastKnownLocation: z.string().trim().min(1).max(500),
    status: profileStatusSchema.default("active"),
    contactPhone: z.string().trim().min(1).max(50).nullish(),
    notes: z.string().max(5000).nullish(),
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
