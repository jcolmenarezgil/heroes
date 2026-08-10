import React from "react";
import { getTranslations } from "next-intl/server";
import { GitHubCommunitySection } from "@/components/community/GitHubCommunitySection";
import { HeartIcon, DocumentTextIcon, CodeBracketIcon } from "@/components/icons";

export default async function AboutPage() {
    const t = await getTranslations("about");

    return (
        <div className="mx-auto max-w-4xl space-y-8 pb-16 pt-4">
            {/* Header / Visión del Proyecto */}
            <header className="space-y-3 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                    <HeartIcon className="h-3.5 w-3.5 text-blue-400" />
                    <span>{t("badge")}</span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                    {t("title")}
                </h1>
                <p className="text-sm text-neutral-400 sm:text-base">
                    {t("description")}
                </p>
            </header>

            {/* Tarjeta de Licencia y Atribución */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <DocumentTextIcon className="h-4 w-4 text-emerald-400" />
                        <span>{t("license.title")}</span>
                    </div>
                    <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                        {t("license.description")}
                    </p>
                    <a
                        href="https://github.com/tu-usuario/heroes/blob/main/LICENSE"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-block text-xs font-semibold text-emerald-400 hover:underline"
                    >
                        {t("license.link")}
                    </a>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <CodeBracketIcon className="h-4 w-4 text-blue-400" />
                        <span>{t("contribute.title")}</span>
                    </div>
                    <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                        {t("contribute.description")}
                    </p>
                    <a
                        href="https://github.com/tu-usuario/heroes/blob/main/CONTRIBUTING.md"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-block text-xs font-semibold text-blue-400 hover:underline"
                    >
                        {t("contribute.link")}
                    </a>
                </div>
            </div>

            <GitHubCommunitySection />
        </div>
    );
}