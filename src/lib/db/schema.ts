import {
    pgTable,
    text,
    timestamp,
    date,
    pgEnum,
    jsonb,
    integer,
    primaryKey,
    uuid,
    doublePrecision,
    boolean,
    index,
} from "drizzle-orm/pg-core";
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
            compoundKey: primaryKey({
                columns: [table.provider, table.providerAccountId],
            }),
        },
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
    // References photos.id (a UUID), not a filesystem path. The misleading
    // "Path" name is kept to avoid a wide-reaching rename across the schema,
    // API, and mappers. Stored client-side as the photos.id returned by the
    // upload endpoint and resolved via GET /api/photos/[id].
    photoPath: text("photo_path"),
    isMinor: boolean("is_minor").default(false).notNull(),
    lastKnownLocation: text("last_known_location").notNull(),

    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),

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

export const EmergencyShelter = pgTable("emergency_shelter", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    capacity: integer("capacity"),
    occupancy: integer("occupancy").default(0),
    status: text("status").notNull().default("active"),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdByUserId: uuid("user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
});

export const photos = pgTable("photos", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    mime: text("mime").notNull(),
    // Base64-encoded image bytes. Kept small by client-side WebP compression.
    data: text("data").notNull(),
    size: integer("size").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const suggestionStatusEnum = pgEnum("suggestion_status_enum", [
    "pending",
    "approved",
    "rejected",
]);

export const profileSuggestions = pgTable("profile_suggestions", {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
        .notNull()
        .references(() => profiles.id, { onDelete: "cascade" }),
    // Nullable: anonymous suggestions are allowed (rate-limited server-side).
    userId: uuid("user_id").references(() => users.id, {
        onDelete: "set null",
    }),
    submitterName: text("submitter_name"),
    submitterContact: text("submitter_contact"),
    note: text("note").notNull(),
    status: suggestionStatusEnum("status").default("pending").notNull(),
    resolvedAt: timestamp("resolved_at", { mode: "date" }),
    resolvedBy: uuid("resolved_by").references(() => users.id, {
        onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { mode: "date" })
        .defaultNow()
        .notNull(),
});

export const notifications = pgTable(
    "notifications",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").notNull(),
        profileId: uuid("profile_id").references(() => profiles.id, {
            onDelete: "cascade",
        }),
        actorId: uuid("actor_id").references(() => users.id, {
            onDelete: "set null",
        }),
        payload: jsonb("payload").$type<Record<string, unknown> | null>(),
        readAt: timestamp("read_at", { mode: "date" }),
        createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    },
    (table) => [
        index("notifications_user_created_idx").on(table.userId, table.createdAt),
        index("notifications_user_read_idx").on(table.userId, table.readAt),
    ]
);