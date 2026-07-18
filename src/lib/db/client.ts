import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
    conn: postgres.Sql | undefined;
};

/**
 * AdminRoleLayout structures the workspace for high-privilege users.
 * It includes a container with a sidebar to streamline direct moderation tasks.
 */

const connectionString = process.env.DATABASE_URL || "";
const connection = globalForDb.conn ?? postgres(connectionString);

if (process.env.NODE_ENV !== "production") {
    globalForDb.conn = connection;
}

export const db = drizzle(connection, { schema });