import { GitHubRepo, GitHubCommit } from '../types';

export async function fetchCommitsForRepo(repo: GitHubRepo): Promise<GitHubCommit[]> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };
    if (repo.token) headers['Authorization'] = `token ${repo.token}`;

    const res = await fetch(
      `https://api.github.com/repos/${repo.owner}/${repo.repo}/commits?per_page=50`,
      { headers }
    );
    if (!res.ok) return [];

    const items = await res.json();
    if (!Array.isArray(items)) return [];

    const repoKey = `${repo.owner}/${repo.repo}`;
    return items.map((item: any): GitHubCommit => ({
      sha: (item.sha ?? '').substring(0, 7),
      repo: repoKey,
      message: ((item.commit?.message ?? '') as string).split('\n')[0].substring(0, 120),
      author: item.commit?.author?.name ?? 'Unknown',
      date: ((item.commit?.author?.date ?? '') as string).substring(0, 10),
      url: item.html_url ?? '',
    })).filter(c => !!c.date);
  } catch {
    return [];
  }
}

export async function fetchAllCommits(repos: GitHubRepo[]): Promise<GitHubCommit[]> {
  if (!repos.length) return [];
  const results = await Promise.all(repos.map(fetchCommitsForRepo));
  const all = results.flat();
  all.sort((a, b) => b.date.localeCompare(a.date));
  return all;
}
