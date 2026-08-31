/**
 * Pure matching/scoring logic for the style quiz. No React, no fetch — callers
 * pass in already-fetched products (pages/api/products.ts shape) and brands
 * (public/data/brands.json shape) so this stays testable and reusable between
 * pages/style-quiz.tsx and the inline picks section on pages/signup.tsx.
 */
import { productMatchesBrand } from './brandMatch';

export type StyleKey = 'minimal' | 'streetwear' | 'techwear' | 'avantgarde';
export type BudgetKey = 'staples' | 'statement' | 'blowMeAway';
export type FitKey = 'oversized' | 'regular' | 'cropped';

export interface QuizAnswers {
  styles: StyleKey[];
  budget: BudgetKey;
  fit: FitKey;
}

export interface Product {
  id: string;
  name: string;
  image: string;
  description: string;
  price: string;
  sugargooLink: string;
  category: string;
  verified?: boolean;
  // From the Sheet's manual STYLE TAGS / FIT columns — see normalizeStyleTagsInput
  // / normalizeFitInput below. Undefined/empty means "not tagged yet", which
  // falls back to the brand/keyword heuristic rather than being treated as N/A.
  manualStyleTags?: StyleKey[];
  manualFit?: FitKey | null;
  excludeFromQuiz?: boolean;
}

export interface Brand {
  brandName: string;
  slug: string;
  description: string;
  aesthetic: string[];
  targetCustomer: string;
  notes: string;
}

export interface MatchedProduct extends Product {
  matchScore: number;
  matchedStyles: StyleKey[];
  budgetMatched: boolean;
  fitMatched: boolean;
}

export const STYLE_OPTIONS: { key: StyleKey; label: string }[] = [
  { key: 'minimal', label: 'Minimal' },
  { key: 'streetwear', label: 'Streetwear' },
  { key: 'techwear', label: 'Techwear' },
  { key: 'avantgarde', label: 'Runway' },
];

export const BUDGET_OPTIONS: { key: BudgetKey; label: string }[] = [
  { key: 'staples', label: 'Budget Staples' },
  { key: 'statement', label: 'Statement Pieces' },
  { key: 'blowMeAway', label: 'Any Price is Fine' },
];

export const FIT_OPTIONS: { key: FitKey; label: string }[] = [
  { key: 'oversized', label: 'Oversized / Boxy Fit' },
  { key: 'regular', label: 'Regular / True to Size' },
  { key: 'cropped', label: 'Cropped / Tailored' },
];

// Maps each quiz style option to the closest real tags in the brand aesthetic
// vocabulary (public/data/brands.json), checked against that file's actual
// ~210 distinct tags rather than guessed blind.
const STYLE_TAG_MAP: Record<StyleKey, string[]> = {
  minimal: ['minimalist', 'clean', 'clean-design', 'clean-lines', 'understated', 'refined', 'sophisticated', 'modern'],
  streetwear: ['streetwear', 'distressed', 'grunge', 'urban', 'hype', 'graphic', 'graphic-heavy', 'bold', 'bold-graphics', 'edgy', 'dark', 'club-culture'],
  techwear: ['techwear', 'functional', 'utility', 'utilitarian', 'industrial', 'structured', 'practical'],
  avantgarde: ['avant-garde', 'experimental', 'conceptual', 'boundary-pushing', 'futuristic', 'artistic', 'unconventional', 'alternative'],
};

// Soft signal only (no product-level fit data exists) — tested against the
// product's name + description text, same technique as categorizeFashionProduct
// in pages/api/products.ts.
const FIT_KEYWORDS: Record<FitKey, string[]> = {
  oversized: ['oversized', 'boxy', 'baggy', 'drop shoulder', 'loose fit', 'relaxed fit'],
  regular: [],
  cropped: ['cropped', 'tailored', 'slim fit', 'fitted', 'slim', 'bodycon'],
};

const ALL_FIT_KEYWORDS = Object.values(FIT_KEYWORDS).flat();

// Accepted spellings for the Sheet's manual STYLE TAGS / FIT columns, keyed by
// lowercased label. Kept forgiving (a few synonyms/formats per key) since
// these are typed by hand, but this is NOT free-text matching — anything not
// in this map is silently ignored rather than guessed at.
const STYLE_LABEL_TO_KEY: Record<string, StyleKey> = {
  minimal: 'minimal',
  clean: 'minimal',
  'minimal/clean': 'minimal',
  'minimal / clean': 'minimal',
  streetwear: 'streetwear',
  distressed: 'streetwear',
  'heavy streetwear': 'streetwear',
  'streetwear/distressed': 'streetwear',
  'heavy streetwear / distressed': 'streetwear',
  techwear: 'techwear',
  functional: 'techwear',
  'functional/techwear': 'techwear',
  'functional / techwear': 'techwear',
  avantgarde: 'avantgarde',
  'avant garde': 'avantgarde',
  'avant-garde': 'avantgarde',
  runway: 'avantgarde',
  'runway/avant garde': 'avantgarde',
  'runway / avant garde': 'avantgarde',
};

const FIT_LABEL_TO_KEY: Record<string, FitKey> = {
  oversized: 'oversized',
  boxy: 'oversized',
  'oversized/boxy': 'oversized',
  'oversized / boxy fit': 'oversized',
  regular: 'regular',
  'true to size': 'regular',
  'regular/true to size': 'regular',
  'regular / true to size': 'regular',
  cropped: 'cropped',
  tailored: 'cropped',
  'cropped/tailored': 'cropped',
  'cropped / tailored': 'cropped',
};

const NA_VALUE = 'n/a';

/**
 * Parses the Sheet's manual "Style Tags" column (comma-separated, e.g.
 * "Streetwear, Techwear"). A literal "N/A" — for non-apparel items like
 * briefcases that don't fit any quiz question — flags the product for
 * exclusion from quiz results entirely, handled in matchProducts(). An empty
 * cell means "not tagged yet" and is left for the heuristic to handle.
 */
export function normalizeStyleTagsInput(raw: string): { tags: StyleKey[]; exclude: boolean } {
  const trimmed = raw.trim();
  if (!trimmed) return { tags: [], exclude: false };
  if (trimmed.toLowerCase() === NA_VALUE) return { tags: [], exclude: true };

  const tags = trimmed
    .split(',')
    .map((s) => STYLE_LABEL_TO_KEY[s.trim().toLowerCase()])
    .filter((key): key is StyleKey => Boolean(key));

  return { tags, exclude: false };
}

/** Same idea as normalizeStyleTagsInput, for the single-value "Fit" column. */
export function normalizeFitInput(raw: string): { fit: FitKey | null; exclude: boolean } {
  const trimmed = raw.trim();
  if (!trimmed) return { fit: null, exclude: false };
  if (trimmed.toLowerCase() === NA_VALUE) return { fit: null, exclude: true };

  return { fit: FIT_LABEL_TO_KEY[trimmed.toLowerCase()] ?? null, exclude: false };
}

function parsePrice(price: string): number {
  const n = parseFloat(price.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

export interface BudgetTiers {
  staples: [number, number];
  statement: [number, number];
  blowMeAway: [number, number];
}

/**
 * Splits the live catalog's price distribution into terciles rather than
 * hardcoding dollar breakpoints, so tiers don't go stale as the sheet changes.
 */
export function computeBudgetTiers(products: Product[]): BudgetTiers {
  const prices = products.map((p) => parsePrice(p.price)).filter((n) => n > 0).sort((a, b) => a - b);
  if (prices.length === 0) {
    return { staples: [0, 30], statement: [30, 80], blowMeAway: [80, Infinity] };
  }
  const p33 = prices[Math.floor(prices.length * 0.33)];
  const p66 = prices[Math.floor(prices.length * 0.66)];
  return {
    staples: [0, p33],
    statement: [p33, p66],
    blowMeAway: [p66, Infinity],
  };
}

function findBrandForProduct(product: Product, brands: Brand[]): Brand | undefined {
  return brands.find((b) => productMatchesBrand(product.name, b.brandName));
}

function scoreProduct(
  product: Product,
  brands: Brand[],
  answers: QuizAnswers,
  tiers: BudgetTiers
): MatchedProduct {
  // Manual tags from the Sheet are authoritative when present; an untagged
  // product (the common case today) falls back to the brand/keyword heuristic.
  let matchedStyles: StyleKey[];
  if (product.manualStyleTags && product.manualStyleTags.length > 0) {
    matchedStyles = answers.styles.filter((style) => product.manualStyleTags!.includes(style));
  } else {
    const brand = findBrandForProduct(product, brands);
    const aesthetic = (brand?.aesthetic ?? []).map((t) => t.toLowerCase());
    matchedStyles = answers.styles.filter((style) =>
      STYLE_TAG_MAP[style].some((tag) => aesthetic.includes(tag))
    );
  }
  const styleScore = matchedStyles.length;

  const price = parsePrice(product.price);
  const [min, max] = tiers[answers.budget];
  const budgetMatched = answers.budget === 'blowMeAway' || (price >= min && price < max) || (max === Infinity && price >= min);
  const budgetScore = budgetMatched ? 1 : 0;

  let fitMatched: boolean;
  let fitScore: number;
  if (product.manualFit) {
    fitMatched = product.manualFit === answers.fit;
    fitScore = fitMatched ? 1 : 0;
  } else {
    const text = `${product.name} ${product.description}`.toLowerCase();
    const positiveFitKeywords = FIT_KEYWORDS[answers.fit];
    const hasPositiveFit = positiveFitKeywords.some((kw) => text.includes(kw));
    const hasConflictingFit = ALL_FIT_KEYWORDS.some(
      (kw) => !positiveFitKeywords.includes(kw) && text.includes(kw)
    );
    fitMatched = hasPositiveFit;
    fitScore = hasPositiveFit ? 1 : hasConflictingFit ? 0 : 0.5;
  }

  const matchScore = styleScore * 3 + budgetScore * 2 + fitScore * 1;

  return { ...product, matchScore, matchedStyles, budgetMatched, fitMatched };
}

/**
 * Ranks (never hard-excludes on style/fit) so the results page can't dead-end
 * at zero products — a product whose brand isn't in brands.json still shows
 * up, just ranked lower. Budget is the only real filter signal, and even that
 * only affects ranking, not inclusion. The one hard exclusion is a product
 * explicitly marked N/A in the Sheet (non-apparel, e.g. briefcases) — those
 * are dropped before scoring so they never appear in quiz results.
 */
export function matchProducts(
  products: Product[],
  brands: Brand[],
  answers: QuizAnswers,
  limit = 30
): MatchedProduct[] {
  const eligible = products.filter((p) => !p.excludeFromQuiz);
  const tiers = computeBudgetTiers(eligible);
  return eligible
    .map((p) => scoreProduct(p, brands, answers, tiers))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}
