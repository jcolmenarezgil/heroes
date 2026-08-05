import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";
import {
    jsonBadRequest,
    jsonOk,
    jsonServerError,
    jsonUnauthorized,
} from "@/lib/api-response";
import { db } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";
import { toNotificationDTO } from "@/lib/notification-mapper";
import { listNotificationsQuerySchema } from "@/lib/validations/notification";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const user = await getAuthUser();
    if (!user) return jsonUnauthorized();

    const url = new URL(request.url);
    const parsed = listNotificationsQuerySchema.safeParse({
        limit: url.searchParams.get("limit") ?? undefined,
        page: url.searchParams.get("page") ?? undefined,
        unreadOnly: url.searchParams.get("unreadOnly") ?? undefined,
    });

    if (!parsed.success) {
        return jsonBadRequest(
            "Invalid query parameters",
            parsed.error.issues
        );
    }

    const { limit, page, unreadOnly } = parsed.data;

    const where =
        unreadOnly === true
            ? and(
                  eq(notifications.userId, user.id),
                  isNull(notifications.readAt)
              )
            : eq(notifications.userId, user.id);

    try {
        const [totalRow] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(notifications)
            .where(where);
        const total = totalRow?.count ?? 0;
        const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

        const [unreadRow] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(notifications)
            .where(
                and(
                    eq(notifications.userId, user.id),
                    isNull(notifications.readAt)
                )
            );
        const unreadCount = unreadRow?.count ?? 0;

        const rows = await db
            .select()
            .from(notifications)
            .where(where)
            .orderBy(desc(notifications.createdAt), desc(notifications.id))
            .limit(limit)
            .offset((page - 1) * limit);

        return jsonOk({
            notifications: rows.map(toNotificationDTO),
            unreadCount,
            total,
            page,
            totalPages,
        });
    } catch (error) {
        console.error("GET /api/notifications failed:", error);
        return jsonServerError();
    }
}
