"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useMessages } from "next-intl";
import { PhoneCallIcon, GlobeIcon } from "@/components/icons";

const DEFAULT_COUNTRY_CODE = "VE";

type EmergencyCategory = "general" | "police" | "medical" | "fire" | "civilProtection";

interface DirectoryContact {
    category: EmergencyCategory;
    label: string;
    number: string;
}

interface DirectoryCountry {
    name: string;
    contacts: Record<string, DirectoryContact>;
}

type EmergencyDirectories = Record<string, DirectoryCountry>;

export function EmergencyDirectory() {
    const t = useTranslations("protocol.emergency");
    const messages = useMessages();
    const [selectedCountry, setSelectedCountry] = useState<string>(DEFAULT_COUNTRY_CODE);

    const directories = (
        messages as {
            protocol: { emergency: { countries: EmergencyDirectories } };
        }
    ).protocol.emergency.countries;

    useEffect(() => {
        // Lee la cookie asignada por el middleware si existe.
        // Client-only read: lazy state init would break SSR hydration, so this
        // sync-from-external-store effect is intentional.
        const match = document.cookie.match(new RegExp("(^| )user-country=([^;]+)"));
        if (match && directories[match[2]]) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedCountry(match[2]);
        }
    }, [directories]);

    const countryCodes = Object.keys(directories);
    const currentDirectory = directories[selectedCountry] || directories[DEFAULT_COUNTRY_CODE];

    return (
        <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 shadow-xl">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                <h2 className="text-sm font-semibold text-white">{t("title")}</h2>

                {/* Selector manual de país */}
                <div className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1">
                    <GlobeIcon className="h-3.5 w-3.5 text-neutral-400" />
                    <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="bg-transparent text-xs font-medium text-white cursor-pointer"
                        aria-label={t("selectCountry")}
                    >
                        {countryCodes.map((code) => (
                            <option key={code} value={code} className="bg-neutral-900 text-white">
                                {directories[code].name} ({code})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Listado de contactos directos */}
            <div className="flex flex-col">
                {Object.entries(currentDirectory.contacts).map(([id, contact]) => {
                    const isCallable = /^[\d\s()+-]+$/.test(contact.number.trim());
                    const pillClasses =
                        "flex shrink-0 items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white";

                    return (
                        <div
                            key={id}
                            className="flex items-center justify-between gap-3 py-1.5"
                        >
                            <p className="truncate text-xs font-medium text-neutral-200">{contact.label}</p>

                            {isCallable ? (
                                <a
                                    href={`tel:${contact.number.replace(/\s+/g, "")}`}
                                    className={`${pillClasses} transition-colors hover:bg-red-500`}
                                >
                                    <PhoneCallIcon className="h-3 w-3" />
                                    <span>{contact.number}</span>
                                </a>
                            ) : (
                                <span className={pillClasses}>
                                    <PhoneCallIcon className="h-3 w-3" />
                                    <span>{contact.number}</span>
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
