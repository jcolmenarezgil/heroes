import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/api-auth";
import {
    jsonBadRequest,
    jsonOk,
    jsonServerError,
    jsonUnauthorized,
} from "@/lib/api-response";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { toUserDTO } from "@/lib/user-mapper";
import { updateUserSchema } from "@/lib/validations/user";

export const dynamic = "force-dynamic";

export async function GET() {
    const user = await getAuthUser();
    if (!user) return jsonUnauthorized();

    try {
        const rows = await db
            .select()
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);

        const row = rows[0];
        if (!row) return jsonUnauthorized();

        return jsonOk(toUserDTO(row));
    } catch (error) {
        console.error("GET /api/users/me failed:", error);
        return jsonServerError();
    }
}

export async function PATCH(request: Request) {
    const user = await getAuthUser();
    if (!user) return jsonUnauthorized();

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return jsonBadRequest("Invalid JSON body");
    }

    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
        return jsonBadRequest("Invalid user data", parsed.error.issues);
    }

    if (Object.keys(parsed.data).length === 0) {
        return jsonBadRequest("No fields to update");
    }

    const { fullName, name, dob, gender, phoneNumbers } = parsed.data;
    const updateData: Record<string, unknown> = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (name !== undefined) updateData.name = name;
    if (dob !== undefined) updateData.dob = dob;
    if (gender !== undefined) updateData.gender = gender;
    if (phoneNumbers !== undefined) updateData.phoneNumbers = phoneNumbers;

    try {
        const [updated] = await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, user.id))
            .returning();

        return jsonOk(toUserDTO(updated));
    } catch (error) {
        console.error("PATCH /api/users/me failed:", error);
        return jsonServerError();
    }
}
