"use client";

import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import UserMenu from "@/components/layout/UserMenu";
import SyncStatus from "@/components/layout/SyncStatus";

export default function NavBar() {
    const t = useTranslations("nav");

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
                    <SyncStatus />
                    <LanguageSwitcher />
                    <UserMenu />
                </div>
            </div>
        </header>
    );
}

