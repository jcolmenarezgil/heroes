import { z } from "zod";

export const listNotificationsQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    page: z.coerce.number().int().min(1).default(1),
    unreadOnly: z
        .union([z.literal("true"), z.literal("false")])
        .transform((v) => v === "true")
        .optional(),
});

export type ListNotificationsQuery = z.infer<
    typeof listNotificationsQuerySchema
>;

export const markNotificationsReadSchema = z
    .object({
        ids: z.array(z.string().uuid()).max(200).optional(),
        all: z.literal(true).optional(),
    })
    .refine((data) => (data.ids && data.ids.length > 0) || data.all === true, {
        message: "Provide ids or set all=true",
    });

export type MarkNotificationsReadInput = z.infer<
    typeof markNotificationsReadSchema
>;
