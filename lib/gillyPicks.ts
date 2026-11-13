import picksConfig from '@/public/data/gillys-picks.json';

// Gilly's Picks pool = product IDs in this range (column A of the sheet).
// Edited in RAPID Studio (studio/), which commits public/data/gillys-picks.json.
export const PICK_ID_MIN = picksConfig.min;
export const PICK_ID_MAX = picksConfig.max;
export const PICKS_PER_VISIT = picksConfig.perVisit;

export function isGillyPick(id: string | number | undefined): boolean {
  const n = Number(id);
  return Number.isInteger(n) && n >= PICK_ID_MIN && n <= PICK_ID_MAX;
}

// Prototype-only placeholder notes, used while the Sheet's GILLY NOTE column
// (column I) is still empty. Off unless NEXT_PUBLIC_SAMPLE_GILLY_NOTES=1, and
// rendered with a visible "sample" label so they can't pass as real notes.
const SAMPLE_NOTES = [
  'fits boxy, take your usual size',
  'heavier than it looks in the photos',
  'wash tones vary, I loved mine',
  'size down if you like it neat',
  'the hardware is metal, not plastic',
  'runs long in the sleeve',
];

export const SAMPLE_NOTES_ON = process.env.NEXT_PUBLIC_SAMPLE_GILLY_NOTES === '1';

export interface GillyNote {
  text: string;
  sample: boolean;
}

/**
 * Gilly's note for a product, or null. Notes only exist for Gilly picks:
 * a note typed into the Sheet for any other row is ignored, so Gilly's
 * handwriting stays tied to products Gilly has actually picked.
 */
export function gillyNoteFor(product: { id: string; gillyNote?: string }): GillyNote | null {
  if (!isGillyPick(product.id)) return null;
  if (product.gillyNote) return { text: product.gillyNote, sample: false };
  if (!SAMPLE_NOTES_ON) return null;
  const n = Number(product.id);
  return n % 3 === 0 ? { text: SAMPLE_NOTES[n % SAMPLE_NOTES.length], sample: true } : null;
}
