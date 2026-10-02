// Latest production deployment of the *site* project, for the header's
// Live / Deploying / Failed indicator. Optional: without a token it reports
// "unconfigured" and the UI hides the indicator.
export type DeployState = 'live' | 'deploying' | 'failed' | 'unconfigured' | 'unknown';

export interface DeployStatus {
  state: DeployState;
  url: string | null;
  createdAt: string | null;
  commitSha: string | null;
}

export async function getDeployStatus(): Promise<DeployStatus> {
  const token = process.env.VERCEL_TOKEN;
  const project = process.env.VERCEL_PROJECT_ID;
  if (!token || !project) return { state: 'unconfigured', url: null, createdAt: null, commitSha: null };
  const params = new URLSearchParams({ projectId: project, target: 'production', limit: '1' });
  if (process.env.VERCEL_TEAM_ID) params.set('teamId', process.env.VERCEL_TEAM_ID);
  try {
    const res = await fetch(`https://api.vercel.com/v6/deployments?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const d = (await res.json()).deployments?.[0];
    if (!d) return { state: 'unknown', url: null, createdAt: null, commitSha: null };
    const s: string = d.state ?? d.readyState;
    const state: DeployState = s === 'READY' ? 'live' : s === 'ERROR' || s === 'CANCELED' ? 'failed' : 'deploying';
    return {
      state,
      url: d.inspectorUrl ?? (d.url ? `https://${d.url}` : null),
      createdAt: d.created ? new Date(d.created).toISOString() : null,
      commitSha: d.meta?.githubCommitSha ?? null,
    };
  } catch {
    return { state: 'unknown', url: null, createdAt: null, commitSha: null };
  }
}
