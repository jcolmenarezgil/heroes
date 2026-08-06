import type { users } from "@/lib/db/schema";

export type UserDTO = Omit<
    typeof users.$inferSelect,
    "emailVerified" | "createdAt" | "updatedAt" | "dob"
> & {
    dob: string | null;
    createdAt: string;
    updatedAt: string;
};

export interface AdminUserListResponse {
    users: UserDTO[];
    total: number;
    page: number;
    totalPages: number;
}
