/**
 * Verifies a "Sign in with Google" ID token (the `credential` the Google
 * Identity Services button hands the browser). Server-only.
 *
 * Uses Google's tokeninfo endpoint, which checks the signature and expiry for
 * us; we then check the token was issued for RAPID's client ID and that Google
 * has verified the email. Signup volume is low enough that one extra HTTPS call
 * per Google sign-in is fine, and it avoids adding a JWT/JWKS dependency.
 */

export interface GoogleIdentity {
  email: string;
  name: string | null;
  sub: string;
}

const ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

export function googleClientId(): string | null {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || null;
}

export async function verifyGoogleCredential(credential: string): Promise<GoogleIdentity | null> {
  const clientId = googleClientId();
  if (!clientId || !credential) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      { signal: controller.signal }
    );
    if (!res.ok) return null;
    const info = (await res.json()) as Record<string, string>;

    if (info.aud !== clientId) return null;
    if (!ISSUERS.has(info.iss)) return null;
    if (Number(info.exp) * 1000 < Date.now()) return null;
    if (info.email_verified !== 'true' || !info.email) return null;

    return { email: info.email.toLowerCase(), name: info.name || null, sub: info.sub };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
