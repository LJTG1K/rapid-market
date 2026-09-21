/**
 * Single source of truth for which ad-platform events each logical funnel
 * action fires. Imported by the browser (lib/tracking.ts, to fire the pixels)
 * and by the server (pages/api/pixel-events.ts, to fire the matching
 * Conversions API events), so the two sides can never disagree on what
 * "a buy click" or "a quiz completion" sends to Meta and Reddit.
 *
 * Isomorphic and dependency-free on purpose — no `window`, no server imports.
 */
import type { StyleKey } from './styleMatch';

export type LogicalEvent = 'buy_click' | 'quiz_complete';
export type PixelPlatform = 'meta' | 'reddit';

/**
 * What the browser observed when it tried to fire a pixel. `queued` means the
 * pixel's stub existed but its real library hadn't loaded yet (still loading,
 * or blocked by an ad blocker) — the event sits in the pixel's queue and only
 * reaches the platform if the library loads later. `missing` means no pixel
 * function was on the page at all.
 */
export type BrowserFireStatus = 'sent' | 'queued' | 'missing' | 'error';
export type ServerFireStatus = 'success' | 'error' | 'skipped';

export interface PlannedEvent {
  platform: PixelPlatform;
  name: string;
}

export interface EventData {
  productId?: string;
  productName?: string;
  /** Free-form origin marker, e.g. 'post_signup' for the generic "Go to Sugargoo" exit. */
  context?: string;
  styles?: StyleKey[];
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

export const VALID_STYLES = Object.keys(QUIZ_STYLE_EVENT_NAMES) as StyleKey[];

export function isLogicalEvent(value: unknown): value is LogicalEvent {
  return value === 'buy_click' || value === 'quiz_complete';
}

/**
 * The full set of platform events one logical action fires.
 *
 * buy_click:
 *  - Meta `ClickToSugargoo` (custom) — the exit-to-Sugargoo signal.
 *  - Reddit `AddToCart`: a campaign's Conversion goal picker only ever offers
 *    Reddit's fixed standard events (Purchase, Lead, Sign up, Page visit, Add
 *    to cart), never a custom event, so `SugargooBuyClick` alone could never be
 *    a Stage 2 bidding target. `AddToCart` is the closest honest fit for
 *    "clicked buy, hasn't paid yet" and is what Stage 2 optimizes against;
 *    `SugargooBuyClick` still fires alongside it so reporting can tell this
 *    click apart from a hypothetical future real cart.
 *
 * quiz_complete:
 *  - Meta `QuizComplete` (custom, with the ticked styles as a parameter). It is
 *    deliberately not Meta's standard `Lead`: RAPID also runs Facebook Lead
 *    Ads, and a quiz completion counted as a Lead would pollute that number.
 *  - Reddit `Lead`, which Stage 1's Conversions campaign optimizes delivery
 *    against, plus one `QuizComplete_<Style>` per style ticked (multi-select
 *    means more than one can fire), which Stage 2's per-style ad groups build
 *    their retargeting audiences from.
 */
export function planEvents(event: LogicalEvent, styles: StyleKey[] = []): PlannedEvent[] {
  if (event === 'buy_click') {
    return [
      { platform: 'meta', name: 'ClickToSugargoo' },
      { platform: 'reddit', name: 'AddToCart' },
      { platform: 'reddit', name: 'SugargooBuyClick' },
    ];
  }
  return [
    { platform: 'meta', name: 'QuizComplete' },
    { platform: 'reddit', name: 'Lead' },
    ...styles.map((style): PlannedEvent => ({ platform: 'reddit', name: QUIZ_STYLE_EVENT_NAMES[style] })),
  ];
}

/**
 * Parameters attached to the Meta event — used as the pixel's params in the
 * browser and as `custom_data` on the server-side CAPI event, so both halves of
 * a dedup pair carry the same payload.
 */
export function metaCustomData(event: LogicalEvent, data: EventData): Record<string, unknown> {
  if (event === 'buy_click') {
    return {
      ...(data.productId ? { content_ids: [data.productId] } : {}),
      ...(data.productName ? { content_name: data.productName } : {}),
      ...(data.context ? { context: data.context } : {}),
    };
  }
  return { styles: (data.styles ?? []).join(',') };
}
