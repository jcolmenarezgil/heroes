import { and, count, desc, eq, sql } from "drizzle-orm";
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
import { profileSuggestions, profiles } from "@/lib/db/schema";
import { createNotification } from "@/lib/notification-helpers";
import {
    listProfileSuggestionsWithUsers,
    profileExists,
    toSuggestionDTO,
} from "@/lib/profile-suggestion-mapper";
import {
    createSuggestionSchema,
    listSuggestionsQuerySchema,
} from "@/lib/validations/profile-suggestion";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{ uuid: string }>;
}

/**
 * Anonymous suggestions are allowed but require a name (the `submitterName`
 * is mandatory when not authenticated to discourage spam). Authenticated
 * users get their userId stamped; the submitted name is ignored in favor of
 * the profile's display name (see toSuggestionDTO).
 */
export async function POST(request: Request, context: RouteContext) {
    const { uuid } = await context.params;

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return jsonBadRequest("Invalid JSON body");
    }

    const parsed = createSuggestionSchema.safeParse(body);
    if (!parsed.success) {
        return jsonBadRequest("Invalid suggestion data", parsed.error.issues);
    }

    const { submitterName, submitterContact, note } = parsed.data;
    const authUser = await getAuthUser().catch(() => null);

    if (!authUser && !submitterName) {
        return jsonBadRequest(
            "Anonymous suggestions must include a submitter name"
        );
    }

    try {
        const exists = await profileExists(uuid);
        if (!exists) return jsonNotFound("Profile not found");

        const [created] = await db
            .insert(profileSuggestions)
            .values({
                profileId: uuid,
                userId: authUser?.id ?? null,
                submitterName: authUser ? null : submitterName ?? null,
                submitterContact: submitterContact ?? null,
                note,
                status: "pending",
            })
            .returning();

        // Notify the profile owner.
        const profileOwner = await db
            .select({ userId: profiles.userId, name: profiles.name })
            .from(profiles)
            .where(eq(profiles.id, uuid))
            .limit(1);
        if (profileOwner[0]?.userId) {
            await createNotification(db, {
                userId: profileOwner[0].userId,
                type: "suggestion.created",
                profileId: uuid,
                actorId: authUser?.id ?? undefined,
                payload: { profileName: profileOwner[0].name },
            });
        }

        const submitter = authUser
            ? {
                  name: authUser.name,
                  fullName: authUser.fullName,
              }
            : null;
        const dto = toSuggestionDTO(created, submitter, null);
        return jsonOk(dto, 201);
    } catch (error) {
        console.error("POST /api/profiles/[uuid]/suggestions failed:", error);
        return jsonServerError();
    }
}

export async function GET(request: Request, context: RouteContext) {
    const { uuid } = await context.params;

    const user = await getAuthUser();
    if (!user) return jsonUnauthorized();

    try {
        const exists = await profileExists(uuid);
        if (!exists) return jsonNotFound("Profile not found");

        const profile = await db
            .select({ userId: profiles.userId })
            .from(profiles)
            .where(eq(profiles.id, uuid))
            .limit(1);
        const profileUserId = profile[0]?.userId;

        // Only the owner, rescuers and admins can list suggestions.
        if (
            user.id !== profileUserId &&
            user.role !== "rescuer" &&
            user.role !== "admin"
        ) {
            return jsonForbidden(
                "You can only view suggestions on profiles you own or manage"
            );
        }

        const url = new URL(request.url);
        const parsed = listSuggestionsQuerySchema.safeParse({
            status: url.searchParams.get("status") ?? undefined,
            page: url.searchParams.get("page") ?? undefined,
            limit: url.searchParams.get("limit") ?? undefined,
        });
        if (!parsed.success) {
            return jsonBadRequest("Invalid query parameters", parsed.error.issues);
        }
        const { status, page, limit } = parsed.data;

        const where = and(
            eq(profileSuggestions.profileId, uuid),
            status ? eq(profileSuggestions.status, status) : sql`true`
        );

        const [countRow] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(profileSuggestions)
            .where(where);
        const total = countRow?.count ?? 0;
        const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

        const [pendingRow] = await db
            .select({ count: count() })
            .from(profileSuggestions)
            .where(
                and(
                    eq(profileSuggestions.profileId, uuid),
                    eq(profileSuggestions.status, "pending")
                )
            );

        const rows = await listProfileSuggestionsWithUsers({
            where,
            orderBy: [desc(profileSuggestions.createdAt), desc(profileSuggestions.id)],
            limit,
            offset: (page - 1) * limit,
        });

        const suggestions = rows.map(({ suggestion, submitter, resolver }) =>
            toSuggestionDTO(suggestion, submitter, resolver)
        );

        return jsonOk({
            suggestions,
            total,
            pendingCount: pendingRow?.count ?? 0,
            page,
            totalPages,
        });
    } catch (error) {
        console.error("GET /api/profiles/[uuid]/suggestions failed:", error);
        return jsonServerError();
    }
}