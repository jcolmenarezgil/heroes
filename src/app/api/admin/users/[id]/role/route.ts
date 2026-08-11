import { eq, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";
import {
    jsonBadRequest,
    jsonForbidden,
    jsonNotFound,
    jsonOk,
    jsonServerError,
    jsonUnauthorized,
} from "@/lib/api-response";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { toUserDTO } from "@/lib/user-mapper";
import { updateUserRoleSchema } from "@/lib/validations/admin";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{ id: string }>;
}

// Change another user's role. Admin-only; cannot demote the last admin.
export async function PATCH(request: Request, context: RouteContext) {
    const user = await getAuthUser();
    if (!user) return jsonUnauthorized();
    if (user.role !== "admin") return jsonForbidden("Admin only");

    const { id } = await context.params;
    if (!id) return jsonBadRequest("User id required");

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return jsonBadRequest("Invalid JSON body");
    }

    const parsed = updateUserRoleSchema.safeParse(body);
    if (!parsed.success) {
        return jsonBadRequest("Invalid role", parsed.error.issues);
    }

    const { role: newRole } = parsed.data;

    if (id === user.id) {
        return jsonBadRequest("You cannot change your own role");
    }

    try {
        return await db.transaction(async (tx) => {
            const [target] = await tx
                .select()
                .from(users)
                .where(eq(users.id, id))
                .limit(1);

            if (!target) return jsonNotFound("User not found");

            if (target.role === "admin" && newRole !== "admin") {
                const [adminCountRow] = await tx
                    .select({ count: sql<number>`count(*)::int` })
                    .from(users)
                    .where(eq(users.role, "admin"));
                const adminCount = adminCountRow?.count ?? 0;
                if (adminCount <= 1) {
                    return jsonBadRequest("Cannot demote the last remaining admin");
                }
            }

            const [updated] = await tx
                .update(users)
                .set({ role: newRole })
                .where(eq(users.id, id))
                .returning();

            return jsonOk(toUserDTO(updated));
        });
    } catch (error) {
        console.error("PATCH /api/admin/users/[id]/role failed:", error);
        return jsonServerError();
    }
}