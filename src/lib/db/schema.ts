import { pgTable, text, timestamp, date, pgEnum, jsonb } from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender_enum", ["male", "female"]);

/**
 * Strict interface for the phone_numbers field to avoid using any[].
 * Allows storing multiple numbers and identifying the preferred emergency contact channel.
 */
export interface UserPhoneConfig {
    phoneNumber: string;
    label: "personal" | "work" | "emergency" | "other";
    isPreferred: boolean;
}

/**
 * 'user' table structured for NextAuth.js v4 and extended for the Heroes onboarding flow.
 * Forces the use of snake_case in the physical SQL engine.
 */
export const user = pgTable("user", {
    id: text("id").primaryKey(),

    fullName: text("full_name").notNull(),

    email: text("email").notNull().unique(),

    emailVerified: timestamp("email_verified", { mode: "date" }),

    image: text("image"),

    phoneNumbers: jsonb("phone_numbers").$type<UserPhoneConfig[]>().default([]).notNull(),

    dob: date("dob"),

    gender: genderEnum("gender"),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),

    updatedAt: timestamp("updated_at", { mode: "date" })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});