import { z } from "zod";

export const userPhoneConfigSchema = z.object({
    phoneNumber: z.string().trim().min(1).max(50),
    label: z.enum(["personal", "work", "emergency", "other"]),
    isPreferred: z.boolean().default(false),
});

export const updateUserSchema = z.object({
    fullName: z.string().trim().min(1).max(200).optional(),
    name: z.string().trim().min(1).max(200).optional(),
    dob: z
        .union([
            z.literal("").transform(() => null),
            z.string().date(),
            z.null(),
        ])
        .optional(),
    gender: z
        .union([
            z.literal("").transform(() => null),
            z.enum(["male", "female"]),
            z.null(),
        ])
        .optional(),
    phoneNumbers: z
        .array(userPhoneConfigSchema)
        .max(10)
        .refine(
            (phones) => phones.filter((p) => p.isPreferred).length <= 1,
            { message: "Only one phone number can be marked as preferred" }
        )
        .optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserPhoneConfigInput = z.infer<typeof userPhoneConfigSchema>;
