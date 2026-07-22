import { useEffect, useState } from 'react';

/**
 * Single source of truth for prefers-reduced-motion. Anime.js animations don't
 * get this for free (unlike the site's old pure-CSS reveal system), so every
 * new motion component checks this once via useAnimeScope rather than
 * hand-rolling matchMedia calls.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
