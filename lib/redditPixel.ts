/**
 * Client-side helper for firing Reddit Pixel events. Mirrors lib/metaPixel.ts
 * so every Sugargoo-exit click reports to both ad platforms from one call
 * site. `eventId` is passed through as `conversionId` so a future
 * server-side Reddit Conversions API call can dedup against this browser
 * event, the same way Meta's Pixel/CAPI pair already dedups on eventId.
 */
import { generateEventId } from './metaPixel';
import type { StyleKey } from './styleMatch';

export function fireRedditPixelEvent(
  eventName: string,
  eventId: string,
  params: Record<string, unknown> = {}
): void {
  if (typeof window === 'undefined') return;
  const rdt = (window as any).rdt;
  if (typeof rdt !== 'function') return;
  rdt('track', eventName, { conversionId: eventId, ...params });
}

// One custom event name per quiz style — kept distinct (rather than a single
// event carrying a `styles` list) because Reddit's audience builder segments
// on whether a *named* event fired, not on a value inside it. See "The Style
// Signal Loop" writeup for the full rationale.
export const QUIZ_STYLE_EVENT_NAMES: Record<StyleKey, string> = {
  minimal: 'QuizComplete_Minimal',
  streetwear: 'QuizComplete_Streetwear',
  techwear: 'QuizComplete_Techwear',
  avantgarde: 'QuizComplete_Runway',
};

/**
 * Fires once when the style quiz is completed: the standard `Lead` event,
 * which is what Stage 1's Conversions campaign actually optimizes delivery
 * against, plus one `QuizComplete_<Style>` custom event per style ticked
 * (multi-select means more than one can fire), which is what Stage 2's
 * per-style ad groups build their retargeting audiences from. Same submit,
 * two purposes — see components/StyleQuiz.tsx callers.
 */
export function fireQuizCompletePixelEvents(styles: StyleKey[]): void {
  const eventId = generateEventId();
  fireRedditPixelEvent('Lead', eventId, { context: 'quiz_complete', styles });
  styles.forEach((style) => {
    const eventName = QUIZ_STYLE_EVENT_NAMES[style];
    if (eventName) {
      fireRedditPixelEvent(eventName, eventId, { context: 'quiz_complete' });
    }
  });
}
