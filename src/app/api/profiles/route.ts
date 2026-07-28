import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";
import {
    jsonBadRequest,
    jsonOk,
    jsonServerError,
    jsonUnauthorized,
} from "@/lib/api-response";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import {
    createProfileSchema,
    listProfilesQuerySchema,
} from "@/lib/validations/profile";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const user = await getAuthUser();
    if (!user) return jsonUnauthorized();

    const url = new URL(request.url);
    const parsed = listProfilesQuerySchema.safeParse({
        q: url.searchParams.get("q") ?? undefined,
        status: url.searchParams.get("status") ?? undefined,
        limit: url.searchParams.get("limit") ?? undefined,
        page: url.searchParams.get("page") ?? undefined,
    });

    if (!parsed.success) {
        return jsonBadRequest("Invalid query parameters", parsed.error.issues);
    }

    const { q, status, limit, page } = parsed.data;

    const conditions = [];
    if (q) conditions.push(ilike(profiles.name, `%${q}%`));
    if (status) conditions.push(eq(profiles.status, status));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    try {
        const [countRow] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(profiles)
            .where(where);

        const total = countRow?.count ?? 0;
        const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

        const rows = await db
            .select()
            .from(profiles)
            .where(where)
            .orderBy(desc(profiles.createdAt), desc(profiles.id))
            .limit(limit)
            .offset((page - 1) * limit);

        return jsonOk({ profiles: rows, total, page, totalPages });
    } catch (error) {
        console.error("GET /api/profiles failed:", error);
        return jsonServerError();
    }
}

export async function POST(request: Request) {
    const user = await getAuthUser();
    if (!user) return jsonUnauthorized();

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return jsonBadRequest("Invalid JSON body");
    }

    const parsed = createProfileSchema.safeParse(body);
    if (!parsed.success) {
        return jsonBadRequest("Invalid profile data", parsed.error.issues);
    }

    const { name, photoUrl, lastKnownLocation, status, contactPhone, notes } =
        parsed.data;

    try {
        const [created] = await db
            .insert(profiles)
            .values({
                userId: user.id,
                name,
                photoUrl: photoUrl ?? null,
                lastKnownLocation,
                status,
                contactPhone: contactPhone ?? null,
                notes: notes ?? null,
            })
            .returning();

        return jsonOk(created, 201);
    } catch (error) {
        console.error("POST /api/profiles failed:", error);
        return jsonServerError();
    }
}
