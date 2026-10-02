// Git-backed content (brands.json, later picks + blog). "github" commits to
// the repo through the API; "local" writes into this working copy for dev.
import { GitHubContent } from './github';
import { LocalContent } from './local';

export interface Snapshot {
  /** Commit the files were read at; commits are made on top of it. */
  sha: string;
  read(path: string): Promise<string>;
}

export { StaleHeadError } from './errors';

export interface ContentBackend {
  readonly mode: 'github' | 'local';
  snapshot(): Promise<Snapshot>;
  /** Commits files on top of parentSha. Throws StaleHeadError if the branch moved. */
  commit(parentSha: string, files: { path: string; content: string }[], message: string): Promise<string>;
  commitUrl(sha: string): string | null;
}

let instance: ContentBackend | null = null;

export function getContent(): ContentBackend {
  if (instance) return instance;
  if (process.env.GITHUB_TOKEN) instance = new GitHubContent();
  else if (process.env.VERCEL) throw new Error('GITHUB_TOKEN is required on Vercel. Local publishing is for development only.');
  else instance = new LocalContent();
  return instance;
}
