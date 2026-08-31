import type { NextApiRequest } from 'next';

/**
 * Base URL for server-side self-fetches to our own API routes (e.g. cron
 * routes pulling /api/products). Deliberately NOT `req.headers.host` in
 * production: Vercel Cron invokes the function via the raw deployment URL,
 * not the custom domain, and this project's SSO Deployment Protection is
 * scoped to "all except custom domains" — so a self-fetch built from
 * req.headers.host hits the SSO wall and gets an HTML login page back
 * instead of JSON. The custom domain is excluded from that protection, so
 * hardcoding it here is what actually works from a cron-triggered request.
 * localhost is kept dynamic so local dev self-fetches still work.
 */
export function getSiteBaseUrl(req: NextApiRequest): string {
  if (req.headers.host?.includes('localhost')) {
    return `http://${req.headers.host}`;
  }
  return 'https://rapid.market';
}
