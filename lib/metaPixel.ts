/**
 * Client-side helper for firing Meta Pixel custom events with a shared
 * event_id, so the browser-side Pixel event dedups against the server-side
 * Conversions API event fired for the same action (see lib/metaConversions.ts).
 */

export function generateEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function fireMetaPixelEvent(
  eventName: string,
  eventId: string,
  params: Record<string, unknown> = {}
): void {
  if (typeof window === 'undefined') return;
  const fbq = (window as any).fbq;
  if (typeof fbq !== 'function') return;
  fbq('trackCustom', eventName, params, { eventID: eventId });
}
