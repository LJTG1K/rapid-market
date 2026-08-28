import type { NextApiRequest } from 'next';

/**
 * Verifies the standard Vercel Cron convention: an `Authorization: Bearer
 * <CRON_SECRET>` header, which Vercel attaches automatically to requests it
 * fires from vercel.json's `crons` config. Also accepts a manually-supplied
 * header for local testing / manual invocation.
 */
export function isAuthorizedCronRequest(req: NextApiRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('⚠️ CRON_SECRET not configured — refusing cron request');
    return false;
  }
  return req.headers.authorization === `Bearer ${secret}`;
}
