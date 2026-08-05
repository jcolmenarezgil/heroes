"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-neutral-900 bg-neutral-950 md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-neutral-900 px-6">
          <span className="text-lg font-semibold tracking-tight text-white">
            Heroes
          </span>
          <span className="rounded border border-amber-800 bg-amber-950 px-2 py-0.5 text-xs font-medium text-amber-400">
            Admin
          </span>
        </div>
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
        <div className="border-t border-neutral-900 px-4 py-4">
          <LanguageSwitcher />
        </div>
      </aside>

      <div className="flex flex-1 flex-col md:pl-64">
        <header className="flex h-14 items-center justify-between border-b border-neutral-900 bg-black px-4 md:px-8">
          <h1 className="text-sm font-medium text-white">Control Panel</h1>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
