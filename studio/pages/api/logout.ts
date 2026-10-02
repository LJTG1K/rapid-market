import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import { SESSION_COOKIE } from '../../lib/auth';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Set-Cookie', serialize(SESSION_COOKIE, '', { path: '/', maxAge: 0 }));
  res.status(200).json({ ok: true });
}
