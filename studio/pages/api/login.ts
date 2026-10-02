import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import { SESSION_COOKIE, SESSION_DAYS, checkPassword, createSessionToken } from '../../lib/auth';
import { clearLoginAttempts, takeLoginAttempt } from '../../lib/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.STUDIO_PASSWORD || !process.env.STUDIO_SESSION_SECRET) {
    return res.status(500).json({ error: 'Studio is not configured (STUDIO_PASSWORD / STUDIO_SESSION_SECRET).' });
  }
  const ip = String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? 'unknown').split(',')[0].trim();
  const limit = takeLoginAttempt(ip);
  if (!limit.ok) return res.status(429).json({ error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSec / 60)} min.` });

  if (!(await checkPassword(String(req.body?.password ?? '')))) {
    return res.status(401).json({ error: 'Wrong password.' });
  }
  clearLoginAttempts(ip);
  const token = await createSessionToken();
  res.setHeader(
    'Set-Cookie',
    serialize(SESSION_COOKIE, token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DAYS * 86400,
    }),
  );
  res.status(200).json({ ok: true });
}
