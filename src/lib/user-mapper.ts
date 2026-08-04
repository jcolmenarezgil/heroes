import type { users } from "@/lib/db/schema";
import type { UserDTO } from "@/types/user";

export function toUserDTO(row: typeof users.$inferSelect): UserDTO {
    return {
        id: row.id,
        email: row.email,
        name: row.name,
        fullName: row.fullName,
        image: row.image,
        role: row.role,
        phoneNumbers: row.phoneNumbers,
        gender: row.gender,
        dob: row.dob ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}
