"use client";

import React from "react";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "?";
}

export default function NavBar() {
  const t = useTranslations("nav");
  const { data: session, status } = useSession();

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-neutral-900 bg-black">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-white"
          aria-label={t("home")}
        >
          <Image
            src="/heroes-logo-app.webp"
            alt=""
            width={32}
            height={32}
            className="h-8 w-auto"
            priority
          />
          Heroes
        </Link>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          {status === "loading" ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-800" />
          ) : session?.user ? (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-xs font-medium text-white"
              title={session.user.name || session.user.email || undefined}
            >
              {getInitials(session.user.name, session.user.email)}
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="text-sm font-medium text-white hover:text-neutral-300"
            >
              {t("signIn")}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
