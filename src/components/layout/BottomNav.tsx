"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { HomeIcon, ReportIcon, MapIcon } from "@/components/icons";
import SyncStatus from "@/components/layout/SyncStatus";

export default function BottomNav() {
    const t = useTranslations("nav");
    const pathname = usePathname();

    const navItems = [
        {
            label: t("home"),
            href: "/",
            icon: (cls: string) => <HomeIcon className={cls} />,
        },
        {
            label: t("map"),
            href: "/map",
            icon: (cls: string) => <MapIcon className={cls} />,
        },
        {
            label: t("create"),
            href: "/create",
            icon: (cls: string) => <ReportIcon className={cls} />,
        },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-neutral-800 bg-neutral-950/95 px-2 backdrop-blur-md md:hidden">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                const activeClasses = isActive
                    ? "text-red-500 font-bold"
                    : "text-neutral-400 hover:text-neutral-200";

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center justify-center space-y-1 text-xs transition-colors ${activeClasses}`}
                    >
                        {item.icon(`h-5 w-5 ${isActive ? "text-red-500" : "text-neutral-400"}`)}
                        <span>{item.label}</span>
                    </Link>
                );
            })}

            <div className="flex flex-col items-center justify-center text-xs">
                <SyncStatus />
            </div>
        </nav>
    );
}