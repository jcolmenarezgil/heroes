import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";
import {
    jsonBadRequest,
    jsonForbidden,
    jsonOk,
    jsonServerError,
    jsonUnauthorized,
} from "@/lib/api-response";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { toUserDTO } from "@/lib/user-mapper";
import { listUsersQuerySchema } from "@/lib/validations/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const user = await getAuthUser();
    if (!user) return jsonUnauthorized();
    if (user.role !== "admin") return jsonForbidden("Admin only");

    const url = new URL(request.url);
    const parsed = listUsersQuerySchema.safeParse({
        q: url.searchParams.get("q") ?? undefined,
        role: url.searchParams.get("role") ?? undefined,
        limit: url.searchParams.get("limit") ?? undefined,
        page: url.searchParams.get("page") ?? undefined,
    });

    if (!parsed.success) {
        return jsonBadRequest(
            "Invalid query parameters",
            parsed.error.issues
        );
    }

    const { q, role, limit, page } = parsed.data;

    const conditions = [];
    if (q) {
        const pattern = `%${q}%`;
        conditions.push(
            or(
                ilike(users.name, pattern),
                ilike(users.fullName, pattern),
                ilike(users.email, pattern)
            )
        );
    }
    if (role && role !== "all") {
        conditions.push(eq(users.role, role));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    try {
        const [countRow] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(users)
            .where(where);

        const total = countRow?.count ?? 0;
        const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

        const rows = await db
            .select()
            .from(users)
            .where(where)
            .orderBy(desc(users.createdAt), desc(users.id))
            .limit(limit)
            .offset((page - 1) * limit);

        return jsonOk({
            users: rows.map((row) => toUserDTO(row)),
            total,
            page,
            totalPages,
        });
    } catch (error) {
        console.error("GET /api/admin/users failed:", error);
        return jsonServerError();
    }
}