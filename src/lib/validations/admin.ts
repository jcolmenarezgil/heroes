import { z } from "zod";

export const mergeProfilesSchema = z.object({
    // The duplicate to delete; its data is folded into `target`.
    source: z.string().uuid(),
    // The canonical profile to keep.
    target: z.string().uuid(),
});

export type MergeProfilesInput = z.infer<typeof mergeProfilesSchema>;