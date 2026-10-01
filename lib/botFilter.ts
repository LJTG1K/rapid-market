/**
 * Shared "is this a crawler / headless browser?" check, used to keep
 * automated traffic out of the ad-platform events that campaigns optimise on.
 * Imported by the browser (lib/tracking.ts) and the server
 * (pages/api/pixel-events.ts). Isomorphic and dependency-free on purpose.
 *
 * Deliberately conservative: it only matches user agents that announce
 * themselves as automated. Bots that spoof a normal mobile UA get through
 * here — the server-side "no browser signal" gate in pixel-events.ts is what
 * catches those for Meta.
 */
const BOT_UA_PATTERN =
  /bot|crawl|spider|slurp|headless|phantomjs|puppeteer|playwright|selenium|lighthouse|pagespeed|gtmetrix|python-requests|python-urllib|aiohttp|httpx|axios|node-fetch|undici|go-http-client|okhttp|java\/|curl|wget|scrapy|facebookexternalhit|meta-externalagent|bytespider|petalbot|ahrefs|semrush|mj12|dataforseo|preview/i;

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent || userAgent.trim().length < 10) return true;
  return BOT_UA_PATTERN.test(userAgent);
}

/** Browser-only: also catches automation frameworks that keep a normal UA but set navigator.webdriver. */
export function isLikelyBotBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  if ((navigator as Navigator & { webdriver?: boolean }).webdriver) return true;
  return isBotUserAgent(navigator.userAgent);
}
