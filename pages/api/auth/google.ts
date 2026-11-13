import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail, toPublicUser, type PublicUser } from '../../../lib/auth/users';
import { setSessionCookie } from '../../../lib/auth/session';
import { verifyGoogleCredential } from '../../../lib/auth/google';

/**
 * "Continue with Google" for RAPID accounts.
 *
 *   mode 'signin' (default)
 *     - a RAPID account with this (Google-verified) email exists → log in.
 *     - otherwise → { status: 'new', email, name }. The browser then runs the
 *       normal /api/sugargoo/register signup with that email, so the Sugargoo
 *       account, referral credit, MailerLite, pixels and UTMs all behave
 *       exactly as for an email signup.
 *
 *   mode 'link'
 *     Only used when that signup came back "email already registered on
 *     Sugargoo": the shopper already has Sugargoo, just not RAPID. Creates the
 *     RAPID account (with an unusable random password, since we never learn
 *     their Sugargoo one) and logs them in. They sign in with Google from then on.
 *
 * Google has verified the email in both modes, which is what makes it safe to
 * log someone into the RAPID account that owns that address.
 */

type Response =
  | { status: 'login'; user: PublicUser }
  | { status: 'new'; email: string; name: string | null }
  | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { credential, mode = 'signin' } = (req.body || {}) as { credential?: string; mode?: 'signin' | 'link' };
  if (!credential) {
    return res.status(400).json({ error: 'Missing Google credential' });
  }

  try {
    const identity = await verifyGoogleCredential(credential);
    if (!identity) {
      return res.status(401).json({ error: "Google sign-in couldn't be verified. Please try again." });
    }

    const existing = await findUserByEmail(identity.email);
    if (existing) {
      setSessionCookie(res, existing.id);
      return res.status(200).json({ status: 'login', user: toPublicUser(existing) });
    }

    if (mode === 'link') {
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      const user = await createUser({
        email: identity.email,
        passwordHash,
        name: identity.name || identity.email.split('@')[0],
      });
      setSessionCookie(res, user.id);
      return res.status(200).json({ status: 'login', user: toPublicUser(user) });
    }

    return res.status(200).json({ status: 'new', email: identity.email, name: identity.name });
  } catch (error) {
    console.error('Google sign-in error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
