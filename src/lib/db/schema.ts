import { pgTable, text, timestamp, date, pgEnum, jsonb, integer, primaryKey, uuid, doublePrecision } from "drizzle-orm/pg-core";
import { AdapterAccount } from "next-auth/adapters";

// Definición física del Enum para el género en PostgreSQL
export const genderEnum = pgEnum("gender_enum", ["male", "female"]);

export const roleEnum = pgEnum("role_enum", ["viewer", "rescuer", "admin"]);
export const profileStatusEnum = pgEnum("profile_status_enum", [
    "active",
    "found",
    "deceased",
]);

export interface UserPhoneConfig {
    phoneNumber: string;
    label: "personal" | "work" | "emergency" | "other";
    isPreferred: boolean;
}
export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),

    name: text("name"),

    fullName: text("full_name").notNull(),

    email: text("email").notNull().unique(),

    emailVerified: timestamp("email_verified", { mode: "date" }),

    image: text("image"),

    phoneNumbers: jsonb("phone_numbers").$type<UserPhoneConfig[]>().default([]).notNull(),

    dob: date("dob"),

    gender: genderEnum("gender"),

    role: roleEnum("role").default("viewer").notNull(),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),

    updatedAt: timestamp("updated_at", { mode: "date" })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const account = pgTable(
    "account",
    {
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").$type<AdapterAccount["type"]>().notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("providerAccountId").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (table) => [
        {
            compoundKey: primaryKey({ columns: [table.provider, table.providerAccountId] }),
        }
    ]
);

export const session = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const profiles = pgTable("profiles", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by")
        .notNull()
        .references(() => users.id, { onDelete: "set null" }),
    updatedBy: uuid("updated_by")
        .notNull()
        .references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    photoUrl: text("photo_url"),
    lastKnownLocation: text("last_known_location").notNull(),
    status: profileStatusEnum("status").default("active").notNull(),
    contactPhone: text("contact_phone"),
    notes: text("notes"),
    verified: timestamp("verified", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

// Tabla de Negocio: Refugios y Puntos de Control Activos en la Crisis
export const EmergencyShelter = pgTable("emergency_shelter", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    capacity: integer("capacity"),
    occupancy: integer("occupancy").default(0),
    status: text("status").notNull().default("active"), // 'active', 'full', 'closed'
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdByUserId: uuid("user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
});