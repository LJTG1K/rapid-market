// Shape of one entry in public/data/brands.json. Unknown extra keys are
// preserved on write, so this only lists the fields Studio edits.
export interface Brand {
  brandName: string;
  slug: string;
  description: string;
  aesthetic: string[];
  targetCustomer: string;
  notes: string;
  [extra: string]: unknown;
}

export const BRAND_FIELDS = ['brandName', 'slug', 'description', 'aesthetic', 'targetCustomer', 'notes'] as const;
export type BrandField = (typeof BRAND_FIELDS)[number];

// public/data/gillys-picks.json: the pool is product IDs min..max (Sheet
// column A); each visit shows a random perVisit of them.
export interface PicksConfig {
  min: number;
  max: number;
  perVisit: number;
}

export const PICKS_FIELDS = ['min', 'max', 'perVisit'] as const;

export type TargetType = 'brand' | 'picks';
export type DraftOp = 'create' | 'update' | 'delete';

interface DraftCommon {
  id: string;
  targetKey: string; // brand slug, or "config" for picks
  editorName: string;
  overwroteEditor: string | null;
  updatedAt: string;
}

export interface BrandDraft extends DraftCommon {
  targetType: 'brand';
  op: DraftOp;
  payload: Brand | null; // desired record (null for delete)
  base: Brand | null; // published record when the draft was started (null for create)
}

export interface PicksDraft extends DraftCommon {
  targetType: 'picks';
  op: 'update';
  payload: PicksConfig;
  base: PicksConfig;
}

export type Draft = BrandDraft | PicksDraft;

export interface Publish {
  id: string;
  editorName: string;
  commitSha: string;
  summary: string;
  createdAt: string;
  revertOf: string | null;
  revertedBy: string | null;
}

// One field-level change. field "__record" means a whole brand was
// created (oldValue null) or deleted (newValue null).
export interface Change {
  publishId: string;
  targetType: TargetType;
  targetKey: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface FieldDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}
