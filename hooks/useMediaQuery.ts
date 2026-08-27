import { useEffect, useState } from 'react';

/**
 * Tracks a media query, for the cases where CSS `hidden lg:block` isn't enough
 * — notably keeping heavy images out of the DOM entirely on viewports that will
 * never display them. A `display: none` subtree still costs bytes if its images
 * are eager, and relying on lazy-loading to suppress those fetches depends on
 * browser behaviour we'd rather not bet on.
 *
 * Deliberately returns `false` on the server and on the first client render, so
 * SSR and hydration agree; the real value arrives in the effect. Only use this
 * where that one-frame delay is invisible.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
