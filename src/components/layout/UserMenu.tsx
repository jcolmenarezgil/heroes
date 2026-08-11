"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Link as LocalizedLink } from "@/i18n/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { safeCallbackUrl } from "@/lib/callback-url";
import SettingsView from "@/components/panels/SettingsView";

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

export default function UserMenu() {
    const t = useTranslations();
    const tNav = useTranslations("nav");
    const { data: session, status } = useSession();
    const pathname = usePathname();

    const [open, setOpen] = useState(false);
    const [view, setView] = useState<"menu" | "settings">("menu");
    const ref = useRef<HTMLDivElement>(null);

    // Outside click closes the dropdown.
    useEffect(() => {
        if (!open) return;
        const handle = (event: MouseEvent) => {
            if (
                ref.current &&
                !ref.current.contains(event.target as Node)
            ) {
                setOpen(false);
                setView("menu");
            }
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [open]);

    // Escape closes the dropdown.
    useEffect(() => {
        if (!open) return;
        const handle = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
                setView("menu");
            }
        };
        document.addEventListener("keydown", handle);
        return () => document.removeEventListener("keydown", handle);
    }, [open]);

    // Open the menu on demand (e.g. from the navbar's SyncStatus pill).
    useEffect(() => {
        const handle = (event: Event) => {
            const custom = event as CustomEvent<{ view?: "menu" | "settings" }>;
            const nextView = custom.detail?.view ?? "menu";
            setView(nextView);
            setOpen(true);
        };
        window.addEventListener("user-menu:open", handle);
        return () => window.removeEventListener("user-menu:open", handle);
    }, []);

    if (status === "loading") {
        return (
            <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-800" />
        );
    }

    if (!session?.user) {
        return (
            <button
                onClick={() => signIn("google", { callbackUrl: safeCallbackUrl(pathname) })}
                className="text-sm font-medium text-white hover:text-neutral-300"
            >
                {tNav("signIn")}
            </button>
        );
    }

    const user = session.user;
    const isAdmin = user.role === "admin";

    const closeMenu = () => {
        setOpen(false);
        setView("menu");
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-neutral-800 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-white"
                aria-label={t("userMenu.openMenu")}
                aria-expanded={open}
                aria-haspopup="menu"
            >
                {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={user.image}
                        alt=""
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    getInitials(user.name, user.email)
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-neutral-800 bg-neutral-950 p-2 shadow-xl">
                    {view === "menu" ? (
                        <>
                            <div className="px-3 py-2">
                                <p className="text-sm font-medium text-white">
                                    {user.name || user.email}
                                </p>
                                {user.name && user.email && (
                                    <p className="text-xs text-neutral-400">
                                        {user.email}
                                    </p>
                                )}
                                {user.role && (
                                    <span className="mt-1 inline-flex rounded-full bg-neutral-800 px-1.5 py-0 text-[10px] font-medium text-neutral-300">
                                        {t(`admin.roles.${user.role}`)}
                                    </span>
                                )}
                            </div>

                            <div className="my-1 border-t border-neutral-800" />

                            <LocalizedLink
                                href="/me"
                                onClick={closeMenu}
                                className="block rounded-md px-3 py-2 text-sm text-white hover:bg-neutral-900"
                            >
                                {t("userMenu.myProfile")}
                            </LocalizedLink>
                            {isAdmin && (
                                <Link
                                    href="/admin"
                                    onClick={closeMenu}
                                    className="block rounded-md px-3 py-2 text-sm text-white hover:bg-neutral-900"
                                >
                                    {t("userMenu.adminDashboard")}
                                </Link>
                            )}

                            <div className="my-1 border-t border-neutral-800" />

                            <button
                                onClick={() => setView("settings")}
                                className="block w-full rounded-md px-3 py-2 text-left text-sm text-white hover:bg-neutral-900"
                            >
                                {t("userMenu.settings")}
                            </button>

                            <LocalizedLink
                                href="/about"
                                onClick={closeMenu}
                                className="block rounded-md px-3 py-2 text-sm text-white hover:bg-neutral-900"
                            >
                                {t("userMenu.about")}
                            </LocalizedLink>

                            <div className="my-1 border-t border-neutral-800" />

                            <button
                                onClick={() => {
                                    closeMenu();
                                    void signOut();
                                }}
                                className="block w-full rounded-md px-3 py-2 text-left text-sm text-white hover:bg-neutral-900"
                            >
                                {tNav("signOut")}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setView("menu")}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-900 hover:text-white"
                            >
                                <span aria-hidden="true">←</span>
                                {t("settings.back")}
                            </button>

                            <div className="my-1 border-t border-neutral-800" />

                            <SettingsView />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}