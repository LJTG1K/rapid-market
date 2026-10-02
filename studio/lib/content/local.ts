// Dev-only backend: reads and writes the rapid-market working copy directly
// (studio/ sits inside it). Nothing is committed; review with `git diff`.
import fs from 'fs';
import path from 'path';
import type { ContentBackend, Snapshot } from './index';

const REPO_ROOT = path.resolve(process.cwd(), '..');

export class LocalContent implements ContentBackend {
  readonly mode = 'local' as const;

  async snapshot(): Promise<Snapshot> {
    return {
      sha: 'local',
      read: async (p) => fs.readFileSync(path.join(REPO_ROOT, p), 'utf-8'),
    };
  }

  async commit(_parent: string, files: { path: string; content: string }[]) {
    for (const f of files) fs.writeFileSync(path.join(REPO_ROOT, f.path), f.content);
    return `local-${Date.now()}`;
  }

  commitUrl() {
    return null;
  }
}
