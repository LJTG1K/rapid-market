import type { CountryLines } from './types';

/** In-module cache so re-selecting a country during a session doesn't refetch. */
const cache = new Map<string, Promise<CountryLines>>();

export function fetchCountryLines(iso2: string): Promise<CountryLines> {
  const cached = cache.get(iso2);
  if (cached) return cached;

  const promise = fetch(`/data/shipping/lines/${iso2}.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`No rate data for ${iso2} (${r.status})`);
      return r.json() as Promise<CountryLines>;
    })
    .catch((err) => {
      cache.delete(iso2); // don't cache a failure — allow retry
      throw err;
    });

  cache.set(iso2, promise);
  return promise;
}
