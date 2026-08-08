// src/components/community/GitHubCommunitySection.tsx
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { getRepoStats, getRepoContributors } from "@/services/github";
import { StarIcon, GitForkIcon } from "@/components/icons";

export async function GitHubCommunitySection() {
    // Ejecutar las promesas en paralelo para evitar waterfalls
    const [stats, contributors, t] = await Promise.all([
        getRepoStats(),
        getRepoContributors(),
        getTranslations("community"),
    ]);

    if (!stats) return null;

    return (
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white">{t("title")}</h3>
                    <p className="text-xs text-neutral-400">
                        {t("subtitle")}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <a
                        href={stats.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-700"
                    >
                        <StarIcon className="h-4 w-4 text-amber-400" />
                        <span>{t("stars", { count: stats.stargazers_count })}</span>
                    </a>
                    <a
                        href={`${stats.html_url}/fork`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-700"
                    >
                        <GitForkIcon className="h-4 w-4 text-neutral-400" />
                        <span>{t("forks", { count: stats.forks_count })}</span>
                    </a>
                </div>
            </div>

            {contributors.length > 0 && (
                <div className="mt-6 border-t border-neutral-800/80 pt-4">
                    <span className="text-xs font-semibold text-neutral-400">
                        {t("contributors", { count: contributors.length })}
                    </span>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {contributors.map((contributor) => (
                            <a
                                key={contributor.id}
                                href={contributor.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`${contributor.login} (${contributor.contributions} commits)`}
                                className="group relative transition-transform hover:scale-110"
                            >
                                <Image
                                    src={contributor.avatar_url}
                                    alt={contributor.login}
                                    width={36}
                                    height={36}
                                    className="rounded-full border border-neutral-700 group-hover:border-blue-500"
                                />
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}