/**
 * Cached reader for public/data/brands.json — shared by anything that needs
 * to resolve a brand by name/slug server-side (pages/api/track.ts,
 * pages/api/cron/*). Module-level cache is fine: brands.json is a build-time
 * asset, not something that changes within a running serverless instance.
 */
import fs from 'fs';
import path from 'path';

export interface BrandRecord {
  brandName: string;
  slug: string;
  aesthetic: string[];
}

let cache: BrandRecord[] | null = null;

export function loadBrands(): BrandRecord[] {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'brands.json'), 'utf-8');
    cache = JSON.parse(raw);
  } catch {
    cache = [];
  }
  return cache!;
}
