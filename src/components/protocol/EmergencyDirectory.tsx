"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { EMERGENCY_DIRECTORIES, DEFAULT_COUNTRY_CODE } from "@/data/emergencyNumbers";
import { PhoneCallIcon, GlobeIcon } from "@/components/icons";

export function EmergencyDirectory() {
    const t = useTranslations("protocol.emergency");
    const [selectedCountry, setSelectedCountry] = useState<string>(DEFAULT_COUNTRY_CODE);

    useEffect(() => {
        // Lee la cookie asignada por el middleware si existe
        const match = document.cookie.match(new RegExp("(^| )user-country=([^;]+)"));
        if (match && EMERGENCY_DIRECTORIES[match[2]]) {
            setSelectedCountry(match[2]);
        }
    }, []);

    const currentDirectory = EMERGENCY_DIRECTORIES[selectedCountry] || EMERGENCY_DIRECTORIES[DEFAULT_COUNTRY_CODE];

    return (
        <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 md:p-6 shadow-xl">
            <div className="flex flex-col gap-4 border-b border-neutral-800 pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-white">{t("title")}</h2>
                    <p className="text-xs text-neutral-400">{t("description")}</p>
                </div>

                {/* Selector manual de país */}
                <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5">
                    <GlobeIcon className="h-4 w-4 text-neutral-400" />
                    <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer"
                        aria-label={t("selectCountry")}
                    >
                        {Object.values(EMERGENCY_DIRECTORIES).map((country) => (
                            <option key={country.code} value={country.code} className="bg-neutral-900 text-white">
                                {country.name} ({country.code})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Listado de contactos directos */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {currentDirectory.contacts.map((contact) => (
                    <div
                        key={contact.id}
                        className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 p-3.5 transition-colors hover:border-neutral-700"
                    >
                        <div>
                            <p className="text-xs font-medium text-neutral-400">
                                {t(`categories.${contact.category}`)}
                            </p>
                            <p className="text-sm font-semibold text-white">{contact.label}</p>
                        </div>

                        <a
                            href={`tel:${contact.number.replace(/\s+/g, "")}`}
                            className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-500"
                        >
                            <PhoneCallIcon className="h-3.5 w-3.5" />
                            <span>{contact.number}</span>
                        </a>
                    </div>
                ))}
            </div>
        </section>
    );
}