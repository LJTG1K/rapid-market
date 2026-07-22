export interface ParsedStat {
  prefix: string;
  number: number;
  suffix: string;
  decimals: number;
}

/**
 * Parses stat strings like "100+", "47,000+", "4.8★" into their numeric parts
 * for CountUp. Returns null for non-numeric strings (e.g. campaign.tsx's
 * "New Items Daily" stat), which callers should render statically instead.
 */
export function parseNumericValue(raw: string): ParsedStat | null {
  const match = raw.match(/^(\D*)([\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  const [, prefix, numStr, suffix] = match;
  const clean = numStr.replace(/,/g, '');
  const number = parseFloat(clean);
  if (Number.isNaN(number)) return null;
  const decimals = clean.includes('.') ? clean.split('.')[1].length : 0;
  return { prefix, number, suffix, decimals };
}
