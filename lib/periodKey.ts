/**
 * Calendar-based dedupe keys for throttling behavioral automation sends —
 * used as `automation_triggers.dedupe_key` so "once per user per period"
 * doesn't depend on when a user first became eligible, just on the calendar
 * period a cron run falls in. Shared by pages/api/cron/brand-nudge.ts (weekly)
 * and pages/api/cron/wishlist-digest.ts (biweekly).
 */

interface IsoWeekInfo {
  year: number;
  week: number;
}

function isoWeekInfo(date: Date): IsoWeekInfo {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

/** ISO 8601 week key, e.g. "2026-W35". */
export function isoWeekKey(date: Date): string {
  const { year, week } = isoWeekInfo(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** Pairs consecutive ISO weeks into a fortnight key, e.g. "2026-B18" (weeks 35-36). */
export function isoBiweekKey(date: Date): string {
  const { year, week } = isoWeekInfo(date);
  const biweek = Math.ceil(week / 2);
  return `${year}-B${String(biweek).padStart(2, '0')}`;
}
