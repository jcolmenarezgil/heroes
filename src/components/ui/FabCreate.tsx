"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PlusIcon } from "@/components/icons";

interface FabCreateProps {
    href?: string;
    className?: string;
}

export default function FabCreate({
    href = "/create",
    className = "",
}: FabCreateProps) {
    const t = useTranslations("home");

    return (
        <Link
            href={href}
            className={`fixed right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-lg shadow-black/50 transition-all hover:bg-neutral-200 active:scale-95 active:bg-neutral-300 md:bottom-6 bottom-20 ${className}`}
            aria-label={t("create")}
        >
            <PlusIcon className="h-6 w-6 text-black" />
        </Link>
    );
}