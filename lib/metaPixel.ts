/**
 * Client-side helper for firing Meta Pixel custom events with a shared
 * event_id, so the browser-side Pixel event dedups against the server-side
 * Conversions API event fired for the same action (see lib/metaConversions.ts).
 */
import type { BrowserFireStatus } from './pixelEvents';

export function generateEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Returns what actually happened, for the pixel-event ledger: the snippet in
 * _document.tsx installs a queueing stub for `fbq` immediately, and
 * fbevents.js replaces its `callMethod` once it has really loaded — so a stub
 * with no `callMethod` means the event is only queued, not yet (or never, if
 * blocked) sent.
 */
export function fireMetaPixelEvent(
  eventName: string,
  eventId: string,
  params: Record<string, unknown> = {}
): BrowserFireStatus {
  if (typeof window === 'undefined') return 'missing';
  const fbq = (window as any).fbq;
  if (typeof fbq !== 'function') return 'missing';
  try {
    fbq('trackCustom', eventName, params, { eventID: eventId });
  } catch {
    return 'error';
  }
  return typeof fbq.callMethod === 'function' ? 'sent' : 'queued';
}
