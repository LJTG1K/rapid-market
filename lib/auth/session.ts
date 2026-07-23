/**
 * Custom httpOnly signed-cookie session — no NextAuth/iron-session, kept minimal.
 *
 * A session token is `base64url(payload) + "." + HMAC_SHA256(payload)`, where the
 * payload is `{ uid, exp }`. The HMAC (Node's built-in crypto, mirroring the
 * signing already done in pages/api/sugargoo/register.ts) is signed with
 * SESSION_SECRET, so the cookie can be read by the browser transport but not
 * forged. Reads use Next's built-in req.cookies; writes serialize via the
 * `cookie` package.
 */
import crypto from 'crypto';
import { serialize } from 'cookie';
import type { NextApiRequest, NextApiResponse } from 'next';

const COOKIE_NAME = 'rapid_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

interface SessionPayload {
  uid: string;
  exp: number; // Unix seconds
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET not configured');
  return secret;
}

function sign(payloadB64: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
}

export function createSessionToken(userId: string): string {
  const payload: SessionPayload = {
    uid: userId,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${payloadB64}.${sign(payloadB64)}`;
}

/**
 * Returns the userId if the token's signature is valid and it hasn't expired,
 * otherwise null. Never throws on malformed input.
 */
export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;

  try {
    const [payloadB64, providedSig] = token.split('.');
    if (!payloadB64 || !providedSig) return null;

    const expectedSig = sign(payloadB64); // throws if SESSION_SECRET is unset

    // Constant-time compare; lengths must match or timingSafeEqual throws.
    const a = Buffer.from(providedSig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as SessionPayload;
    if (!payload.uid || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload.uid;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: NextApiResponse, userId: string): void {
  const token = createSessionToken(userId);
  res.setHeader(
    'Set-Cookie',
    serialize(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: MAX_AGE_SECONDS,
    })
  );
}

export function clearSessionCookie(res: NextApiResponse): void {
  res.setHeader(
    'Set-Cookie',
    serialize(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
  );
}

/** Reads and verifies the session cookie from an incoming request. */
export function getUserIdFromRequest(req: NextApiRequest): string | null {
  return verifySessionToken(req.cookies[COOKIE_NAME]);
}
