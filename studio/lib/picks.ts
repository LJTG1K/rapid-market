// Pure Gilly's Picks logic (public/data/gillys-picks.json), shared by the
// browser and the server. Mirrors brands.ts: field-level apply, validate,
// and revert-unless-edited-since.
import { eq, type ChangeInput } from './brands';
import { PICKS_FIELDS, type Change, type FieldDiff, type PicksConfig, type PicksDraft } from './types';

export const PICKS_PATH = 'public/data/gillys-picks.json';
export const PICKS_KEY = 'config';
export const MAX_PER_VISIT = 60;

export function serializePicks(c: PicksConfig): string {
  return JSON.stringify({ min: c.min, max: c.max, perVisit: c.perVisit }, null, 2) + '\n';
}

export function normalizePicks(input: Partial<Record<keyof PicksConfig, unknown>>): PicksConfig {
  return { min: Number(input.min), max: Number(input.max), perVisit: Number(input.perVisit) };
}

export function validatePicks(c: PicksConfig): string[] {
  const errors: string[] = [];
  const int = (v: number) => Number.isInteger(v) && v >= 1;
  if (!int(c.min)) errors.push("Gilly's Picks: first product ID must be a whole number of 1 or more.");
  if (!int(c.max)) errors.push("Gilly's Picks: last product ID must be a whole number of 1 or more.");
  if (int(c.min) && int(c.max) && c.max < c.min) errors.push("Gilly's Picks: last product ID must be at least the first.");
  if (!int(c.perVisit) || c.perVisit > MAX_PER_VISIT) errors.push(`Gilly's Picks: products per visit must be between 1 and ${MAX_PER_VISIT}.`);
  return errors;
}

export function diffPicksDraft(d: PicksDraft): FieldDiff[] {
  return PICKS_FIELDS.filter((f) => d.base[f] !== d.payload[f]).map((f) => ({ field: f, oldValue: d.base[f], newValue: d.payload[f] }));
}

export function applyPicksDraft(current: PicksConfig, d: PicksDraft) {
  const next = { ...current };
  const changes: ChangeInput[] = [];
  const warnings: string[] = [];
  for (const f of PICKS_FIELDS) {
    if (d.base[f] === d.payload[f]) continue;
    if (current[f] !== d.base[f]) warnings.push(`Gilly's Picks ${f} was changed upstream after this draft started. Publishing overwrites it.`);
    if (current[f] === d.payload[f]) continue;
    changes.push({ targetType: 'picks', targetKey: PICKS_KEY, field: f, oldValue: current[f], newValue: d.payload[f] });
    next[f] = d.payload[f];
  }
  return { config: next, changes, warnings };
}

export function revertPicks(current: PicksConfig, changes: Change[]) {
  const next = { ...current } as Record<string, unknown>;
  const applied: ChangeInput[] = [];
  const skipped: string[] = [];
  for (const c of [...changes].reverse()) {
    if (c.targetType !== 'picks') continue;
    if (!eq(next[c.field], c.newValue)) {
      skipped.push(`Gilly's Picks ${c.field} changed again since, so it wasn't restored.`);
      continue;
    }
    applied.push({ targetType: 'picks', targetKey: PICKS_KEY, field: c.field, oldValue: next[c.field], newValue: c.oldValue });
    next[c.field] = c.oldValue;
  }
  return { config: next as unknown as PicksConfig, applied, skipped };
}

/** Products whose numeric ID (Sheet column A) falls in the range, as the site filters them. */
export function inPicksRange(id: string, c: Pick<PicksConfig, 'min' | 'max'>): boolean {
  const n = Number(id);
  return Number.isInteger(n) && n >= c.min && n <= c.max;
}
