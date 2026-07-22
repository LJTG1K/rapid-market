import { useEffect, useLayoutEffect } from 'react';

/** useLayoutEffect on the client (runs before paint, avoiding an unanimated
 *  flash), falls back to useEffect during SSR where useLayoutEffect warns. */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
