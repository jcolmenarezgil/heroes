import { z } from "zod";

export const mergeProfilesSchema = z.object({
    // The duplicate to delete; its data is folded into `target`.
    source: z.string().uuid(),
    // The canonical profile to keep.
    target: z.string().uuid(),
});

export type MergeProfilesInput = z.infer<typeof mergeProfilesSchema>;

export const adminRoleFilterSchema = z.enum([
    "all",
    "viewer",
    "rescuer",
    "admin",
]);

export const listUsersQuerySchema = z.object({
    q: z.string().trim().min(1).max(200).optional(),
    role: adminRoleFilterSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(20),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const updateUserRoleSchema = z.object({
    role: z.enum(["viewer", "rescuer", "admin"]),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;