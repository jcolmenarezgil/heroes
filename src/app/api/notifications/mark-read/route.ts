import { and, eq, inArray, isNull } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";
import {
    jsonBadRequest,
    jsonOk,
    jsonServerError,
    jsonUnauthorized,
} from "@/lib/api-response";
import { db } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";
import { markNotificationsReadSchema } from "@/lib/validations/notification";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    const user = await getAuthUser();
    if (!user) return jsonUnauthorized();

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return jsonBadRequest("Invalid JSON body");
    }

    const parsed = markNotificationsReadSchema.safeParse(body);
    if (!parsed.success) {
        return jsonBadRequest("Invalid payload", parsed.error.issues);
    }

    const { ids, all } = parsed.data;

    try {
        const where =
            all === true
                ? and(
                      eq(notifications.userId, user.id),
                      isNull(notifications.readAt)
                  )
                : and(
                      eq(notifications.userId, user.id),
                      isNull(notifications.readAt),
                      inArray(notifications.id, ids ?? [])
                  );

        const updated = await db
            .update(notifications)
            .set({ readAt: new Date() })
            .where(where)
            .returning({ id: notifications.id });

        return jsonOk({ updated: updated.length });
    } catch (error) {
        console.error("POST /api/notifications/mark-read failed:", error);
        return jsonServerError();
    }
}
