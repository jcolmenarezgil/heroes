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