export interface GitHubRepoStats {
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    html_url: string;
}

export interface GitHubContributor {
    id: number;
    login: string;
    avatar_url: string;
    html_url: string;
    contributions: number;
}

const GITHUB_OWNER = "jcolmenarezgil";
const GITHUB_REPO = "heroes";
const CACHE_REVALIDATE_SECONDS = 3600;

export async function getRepoStats(): Promise<GitHubRepoStats | null> {
    try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`, {
            headers: {
                Accept: "application/vnd.github+json",
                "User-Agent": "HeroesApp-Web",
            },
            next: { revalidate: CACHE_REVALIDATE_SECONDS },
        });

        if (!res.ok) return null;
        return (await res.json()) as GitHubRepoStats;
    } catch {
        return null;
    }
}

export async function getRepoContributors(): Promise<GitHubContributor[]> {
    try {
        const res = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contributors?per_page=100`,
            {
                headers: {
                    Accept: "application/vnd.github+json",
                    "User-Agent": "HeroesApp-Web",
                },
                next: { revalidate: CACHE_REVALIDATE_SECONDS },
            }
        );

        if (!res.ok) return [];
        return (await res.json()) as GitHubContributor[];
    } catch {
        return [];
    }
}