// Shared-password sessions (SPEC.md § Users & access). Uses Web Crypto so the
// same code runs in middleware (edge) and API routes (node).
export const SESSION_COOKIE = 'studio_session';
export const SESSION_DAYS = 30;

const enc = new TextEncoder();

function b64url(buf: ArrayBuffer): string {
  let s = '';
  new Uint8Array(buf).forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// The signing key includes the password, so rotating STUDIO_PASSWORD (or the
// secret) invalidates every existing session.
async function sign(data: string): Promise<string | null> {
  const secret = process.env.STUDIO_SESSION_SECRET;
  const password = process.env.STUDIO_PASSWORD;
  if (!secret || !password) return null;
  const key = await crypto.subtle.importKey('raw', enc.encode(`${secret}:${password}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(): Promise<string | null> {
  const exp = String(Date.now() + SESSION_DAYS * 86400_000);
  const sig = await sign(exp);
  return sig ? `${exp}.${sig}` : null;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const expected = await sign(exp);
  return !!expected && safeEqual(sig, expected);
}

export async function checkPassword(attempt: string): Promise<boolean> {
  const password = process.env.STUDIO_PASSWORD;
  if (!password) return false;
  // Compare digests, not raw strings, so length/timing leaks nothing useful.
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(attempt)),
    crypto.subtle.digest('SHA-256', enc.encode(password)),
  ]);
  return safeEqual(b64url(a), b64url(b));
}
