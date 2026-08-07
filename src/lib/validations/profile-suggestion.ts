import { z } from "zod";

export const createSuggestionSchema = z.object({
    submitterName: z.string().trim().min(1).max(200).optional(),
    submitterContact: z.string().trim().min(1).max(200).optional(),
    note: z.string().trim().min(1).max(1000),
});

export const suggestionStatusSchema = z.enum(["pending", "approved", "rejected"]);

export const listSuggestionsQuerySchema = z.object({
    status: suggestionStatusSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateSuggestionInput = z.infer<typeof createSuggestionSchema>;
export type ListSuggestionsQuery = z.infer<typeof listSuggestionsQuerySchema>;