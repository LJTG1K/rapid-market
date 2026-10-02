// Pure brand logic shared by the browser and the server: diffing drafts,
// applying them to brands.json, validating, and reverting a publish.
import { BRAND_FIELDS, type Brand, type BrandDraft, type Change, type Draft, type FieldDiff } from './types';

export const BRANDS_PATH = 'public/data/brands.json';
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const RESERVED_SLUG_LIST = ['new'];
const RESERVED_SLUGS = new Set(RESERVED_SLUG_LIST);

export type ChangeInput = Omit<Change, 'publishId'>;

export function eq(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, '-');
}

export function normalizeBrand(input: Partial<Brand>): Brand {
  const tags = (input.aesthetic ?? []).map(normalizeTag).filter(Boolean);
  return {
    ...input,
    brandName: (input.brandName ?? '').trim(),
    slug: (input.slug ?? '').trim(),
    description: (input.description ?? '').trim(),
    aesthetic: Array.from(new Set(tags)),
    targetCustomer: (input.targetCustomer ?? '').trim(),
    notes: (input.notes ?? '').trim(),
  };
}

// brands.json is committed as LF, 2-space JSON with a trailing newline,
// sorted by brand name. Match that exactly so diffs stay minimal.
export function serializeBrands(brands: Brand[]): string {
  return JSON.stringify(brands, null, 2) + '\n';
}

export function sortBrands(brands: Brand[]): Brand[] {
  return [...brands].sort((a, b) => a.brandName.localeCompare(b.brandName, undefined, { sensitivity: 'base' }));
}

function isBlank(v: unknown): boolean {
  return v == null || v === '' || (Array.isArray(v) && v.length === 0);
}

export function diffBrandDraft(draft: BrandDraft): FieldDiff[] {
  if (draft.op === 'create' && draft.payload) {
    return BRAND_FIELDS.filter((f) => !isBlank(draft.payload![f])).map((f) => ({ field: f, oldValue: null, newValue: draft.payload![f] }));
  }
  if (draft.op === 'delete') return [{ field: '__record', oldValue: draft.base, newValue: null }];
  const base = draft.base ?? ({} as Brand);
  const next = draft.payload ?? ({} as Brand);
  return BRAND_FIELDS.filter((f) => !eq(base[f], next[f])).map((f) => ({ field: f, oldValue: base[f], newValue: next[f] }));
}

export function brandDraftLabel(draft: BrandDraft): string {
  return (draft.payload ?? draft.base)?.brandName || draft.targetKey;
}

/** Working copy = published brands with every pending draft applied (for the UI). */
export function workingBrands(published: Brand[], drafts: Draft[]): Brand[] {
  const map = new Map(published.map((b) => [b.slug, b]));
  for (const d of drafts) {
    if (d.targetType !== 'brand') continue;
    if (d.op === 'delete') map.delete(d.targetKey);
    else if (d.payload) map.set(d.targetKey, d.payload);
  }
  return sortBrands(Array.from(map.values()));
}

export interface ApplyResult {
  brands: Brand[];
  changes: ChangeInput[];
  errors: string[];
  warnings: string[];
}

/**
 * Applies drafts field-by-field onto the *current* published file, so an
 * upstream edit to a field the draft didn't touch is preserved.
 */
export function applyDrafts(current: Brand[], drafts: Draft[]): ApplyResult {
  const brands = current.map((b) => ({ ...b }));
  const changes: ChangeInput[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const indexOf = (slug: string) => brands.findIndex((b) => b.slug === slug);

  for (const d of drafts.filter((x): x is BrandDraft => x.targetType === 'brand')) {
    const label = brandDraftLabel(d);
    const idx = indexOf(d.targetKey);
    if (d.op === 'create') {
      if (idx !== -1) {
        errors.push(`"${label}": a brand with slug "${d.targetKey}" already exists.`);
        continue;
      }
      brands.push(d.payload!);
      changes.push({ targetType: 'brand', targetKey: d.targetKey, field: '__record', oldValue: null, newValue: d.payload });
    } else if (d.op === 'delete') {
      if (idx === -1) {
        warnings.push(`"${label}" was already removed upstream, so there's nothing to delete.`);
        continue;
      }
      changes.push({ targetType: 'brand', targetKey: d.targetKey, field: '__record', oldValue: brands[idx], newValue: null });
      brands.splice(idx, 1);
    } else {
      if (idx === -1) {
        errors.push(`"${label}" no longer exists in brands.json (deleted upstream). Discard this draft.`);
        continue;
      }
      const target = brands[idx] as Record<string, unknown>;
      for (const f of BRAND_FIELDS) {
        const from = d.base?.[f];
        const to = d.payload?.[f];
        if (eq(from, to)) continue;
        if (!eq(target[f], from)) {
          warnings.push(`"${label}" ${f} was changed upstream after this draft started. Publishing overwrites it.`);
        }
        if (eq(target[f], to)) continue;
        changes.push({ targetType: 'brand', targetKey: d.targetKey, field: f, oldValue: target[f], newValue: to });
        target[f] = to;
      }
    }
  }
  return { brands: sortBrands(brands), changes, errors, warnings };
}

export function validateBrands(brands: Brand[]): string[] {
  const errors: string[] = [];
  const slugs = new Map<string, number>();
  const names = new Map<string, number>();
  for (const b of brands) {
    const label = b.brandName || b.slug || '(unnamed brand)';
    if (!b.brandName?.trim()) errors.push(`${label}: brand name is required.`);
    if (!b.description?.trim()) errors.push(`${label}: description is required.`);
    if (!SLUG_RE.test(b.slug ?? '')) errors.push(`${label}: slug "${b.slug}" must be lowercase letters, numbers and single hyphens.`);
    if (RESERVED_SLUGS.has(b.slug)) errors.push(`${label}: slug "${b.slug}" is reserved.`);
    if (!Array.isArray(b.aesthetic) || b.aesthetic.some((t) => typeof t !== 'string' || !t.trim())) {
      errors.push(`${label}: tags must be non-empty text.`);
    }
    slugs.set(b.slug, (slugs.get(b.slug) ?? 0) + 1);
    const n = (b.brandName ?? '').trim().toLowerCase();
    names.set(n, (names.get(n) ?? 0) + 1);
  }
  slugs.forEach((c, s) => c > 1 && errors.push(`Slug "${s}" is used by ${c} brands.`));
  names.forEach((c, n) => c > 1 && errors.push(`Brand name "${n}" is used by ${c} brands.`));
  return errors;
}

/**
 * Inverse of a publish's changes, applied to the current file. Anything
 * edited again since that publish is skipped and reported, never clobbered.
 */
export function revertChanges(current: Brand[], changes: Change[]) {
  const brands = current.map((b) => ({ ...b }));
  const applied: ChangeInput[] = [];
  const skipped: string[] = [];
  for (const c of [...changes].reverse()) {
    if (c.targetType !== 'brand') continue;
    const idx = brands.findIndex((b) => b.slug === c.targetKey);
    if (c.field === '__record') {
      if (c.oldValue === null) {
        // Undo a create.
        if (idx === -1) continue;
        if (!eq(brands[idx], c.newValue)) {
          skipped.push(`"${c.targetKey}" was edited after it was created, so it wasn't removed.`);
          continue;
        }
        applied.push({ targetType: 'brand', targetKey: c.targetKey, field: '__record', oldValue: brands[idx], newValue: null });
        brands.splice(idx, 1);
      } else {
        // Undo a delete.
        if (idx !== -1) {
          skipped.push(`"${c.targetKey}" exists again, so it wasn't restored.`);
          continue;
        }
        brands.push(c.oldValue as Brand);
        applied.push({ targetType: 'brand', targetKey: c.targetKey, field: '__record', oldValue: null, newValue: c.oldValue });
      }
      continue;
    }
    if (idx === -1) {
      skipped.push(`"${c.targetKey}" no longer exists, so ${c.field} wasn't restored.`);
      continue;
    }
    const b = brands[idx] as Record<string, unknown>;
    if (!eq(b[c.field], c.newValue)) {
      skipped.push(`"${c.targetKey}" ${c.field} changed again since, so it wasn't restored.`);
      continue;
    }
    applied.push({ targetType: 'brand', targetKey: c.targetKey, field: c.field, oldValue: b[c.field], newValue: c.oldValue });
    b[c.field] = c.oldValue;
  }
  return { brands: sortBrands(brands), applied, skipped };
}

export function summarizeChanges(changes: ChangeInput[], names: Map<string, string>): string {
  const created = new Set<string>();
  const deleted = new Set<string>();
  const updated = new Set<string>();
  let picks = false;
  for (const c of changes) {
    if (c.targetType === 'picks') picks = true;
    else if (c.field !== '__record') updated.add(c.targetKey);
    else if (c.oldValue === null) created.add(c.targetKey);
    else deleted.add(c.targetKey);
  }
  const part = (verb: string, set: Set<string>) => {
    const list = Array.from(set).map((s) => names.get(s) ?? s);
    if (!list.length) return null;
    return `${verb} ${list.length > 3 ? `${list.slice(0, 3).join(', ')} +${list.length - 3} more` : list.join(', ')}`;
  };
  return [part('Add', created), part('Update', updated), part('Delete', deleted), picks && "Update Gilly's Picks"].filter(Boolean).join('; ') || 'No changes';
}
