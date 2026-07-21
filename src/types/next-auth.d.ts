import { DefaultSession } from "next-auth";
import { roleEnum } from "@/lib/db/schema";

type Role = (typeof roleEnum.enumValues)[number];

declare module "next-auth" {
  interface User {
    id: string;
    role?: Role;
  }

  interface Session {
    user: User & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
  }
}
