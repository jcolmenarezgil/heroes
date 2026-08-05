"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import NavBar from "@/components/layout/NavBar";

const navItems: {
  href: string;
  labelKey: "dashboard" | "profiles" | "users";
  exact: boolean;
}[] = [
  { href: "/admin", labelKey: "dashboard", exact: true },
  { href: "/admin/profiles", labelKey: "profiles", exact: false },
  { href: "/admin/users", labelKey: "users", exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen bg-black text-white">
      <NavBar />

      <aside className="fixed left-0 top-14 z-30 hidden w-64 flex-col border-r border-neutral-900 bg-neutral-950 md:flex">
        <nav className="flex-1 space-y-1 px-4 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive(item.href, item.exact)
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
              }`}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col md:pl-64">
        <div className="h-14 shrink-0" />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
