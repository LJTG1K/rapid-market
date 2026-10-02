// Commits through GitHub's Git Data API: one commit per publish, made on top
// of the exact commit the files were read from. If the branch moved in the
// meantime the ref update is rejected (no force) and the caller retries.
import { StaleHeadError } from './errors';
import type { ContentBackend, Snapshot } from './index';

const API = 'https://api.github.com';

export class GitHubContent implements ContentBackend {
  readonly mode = 'github' as const;
  private repo = process.env.GITHUB_REPO || 'LJTG1K/rapid-market';
  private branch = process.env.GITHUB_BRANCH || 'main';

  private async gh(path: string, init: RequestInit & { accept?: string } = {}) {
    const res = await fetch(`${API}/repos/${this.repo}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: init.accept ?? 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
      signal: AbortSignal.timeout(15_000),
    });
    return res;
  }

  private async json(path: string, init?: RequestInit) {
    const res = await this.gh(path, init);
    if (!res.ok) throw new Error(`GitHub ${init?.method ?? 'GET'} ${path} failed: ${res.status} ${await res.text()}`);
    return res.json();
  }

  async snapshot(): Promise<Snapshot> {
    const ref = await this.json(`/git/ref/heads/${this.branch}`);
    const sha: string = ref.object.sha;
    return {
      sha,
      read: async (p) => {
        const res = await this.gh(`/contents/${p}?ref=${sha}`, { accept: 'application/vnd.github.raw+json' });
        if (!res.ok) throw new Error(`GitHub read ${p} failed: ${res.status}`);
        return res.text();
      },
    };
  }

  async commit(parentSha: string, files: { path: string; content: string }[], message: string) {
    const parent = await this.json(`/git/commits/${parentSha}`);
    const tree = await this.json('/git/trees', {
      method: 'POST',
      body: JSON.stringify({
        base_tree: parent.tree.sha,
        tree: files.map((f) => ({ path: f.path, mode: '100644', type: 'blob', content: f.content })),
      }),
    });
    const commit = await this.json('/git/commits', {
      method: 'POST',
      body: JSON.stringify({ message, tree: tree.sha, parents: [parentSha] }),
    });
    const res = await this.gh(`/git/refs/heads/${this.branch}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: commit.sha, force: false }),
    });
    if (res.status === 422) throw new StaleHeadError('Branch moved during publish');
    if (!res.ok) throw new Error(`GitHub ref update failed: ${res.status} ${await res.text()}`);
    return commit.sha as string;
  }

  commitUrl(sha: string) {
    return `https://github.com/${this.repo}/commit/${sha}`;
  }
}
