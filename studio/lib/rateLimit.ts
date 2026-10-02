// Best-effort login throttle. In-memory, so on Vercel it's per warm instance —
// enough to blunt casual guessing, not a substitute for a strong password.
const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 8;
const hits = new Map<string, { count: number; resetAt: number }>();

export function takeLoginAttempt(ip: string): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfterSec: 0 };
  }
  entry.count++;
  return entry.count > MAX_ATTEMPTS
    ? { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) }
    : { ok: true, retryAfterSec: 0 };
}

export function clearLoginAttempts(ip: string) {
  hits.delete(ip);
}
