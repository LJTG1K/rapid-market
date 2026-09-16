/**
 * Client-side marketing-channel attribution. Separate from the signup
 * `source` field (website form vs Facebook Lead Ads webhook) — this tracks
 * which ad channel actually drove the visit, so signups can be split by
 * Reddit vs Meta vs organic instead of everything landing in one "website"
 * bucket. Captured once on the entry page and carried in localStorage
 * through to whichever page the signup form is actually submitted on.
 */

const STORAGE_KEY = 'rapid_attribution';

export interface Attribution {
  channel: string;
  utmMedium?: string;
  utmCampaign?: string;
  landingPath: string;
}

/** Dedicated per-channel landing pages that carry no UTM params on their own links. */
function inferChannelFromPath(pathname: string): string | null {
  if (pathname === '/reddit') return 'reddit';
  if (pathname === '/campaign') return 'meta';
  return null;
}

/**
 * Reads utm_source/utm_medium/utm_campaign off the current URL and persists
 * them, falling back to inferring a channel from a dedicated landing page
 * path (e.g. /reddit) when no UTM params are present. An explicit utm_source
 * always overwrites whatever was previously stored (last non-organic touch
 * wins); with no utm_source present, an existing stored value is left alone
 * so navigating on-site to a plain page like /signup doesn't erase the
 * channel captured on the entry page. Call on every page load/route change —
 * best-effort and silent if localStorage is unavailable.
 */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');

    if (utmSource) {
      const attribution: Attribution = {
        channel: utmSource,
        utmMedium: params.get('utm_medium') || undefined,
        utmCampaign: params.get('utm_campaign') || undefined,
        landingPath: window.location.pathname,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
      return;
    }

    if (!window.localStorage.getItem(STORAGE_KEY)) {
      const inferred = inferChannelFromPath(window.location.pathname);
      if (inferred) {
        const attribution: Attribution = { channel: inferred, landingPath: window.location.pathname };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
      }
    }
  } catch {
    // Private browsing / blocked storage — attribution is best-effort only.
  }
}

export function getAttribution(): Attribution | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    return null;
  }
}

const CLICK_ID_STORAGE_KEY = 'rapid_reddit_click_id';

/**
 * Reddit's click ID (rdt_cid), auto-appended to the landing URL when a user
 * clicks a Reddit ad. Captured once and persisted so it's still available
 * whichever later page actually fires a conversion event (quiz complete,
 * buy click, signup) — the Reddit Conversions API needs it passed explicitly
 * since, unlike the browser pixel, it has no access to the page URL. Call
 * alongside captureAttribution() on every page load/route change.
 */
export function captureRedditClickId(): void {
  if (typeof window === 'undefined') return;
  try {
    const clickId = new URLSearchParams(window.location.search).get('rdt_cid');
    if (clickId) {
      window.localStorage.setItem(CLICK_ID_STORAGE_KEY, clickId);
    }
  } catch {
    // Private browsing / blocked storage — best-effort only.
  }
}

export function getRedditClickId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(CLICK_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}
