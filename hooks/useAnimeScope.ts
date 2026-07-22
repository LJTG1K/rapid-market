import { useRef, RefObject } from 'react';
import { createScope, Scope } from 'animejs';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

type Setup = (self: Scope) => void | (() => void);

interface UseAnimeScopeOptions<T extends HTMLElement> {
  /** Re-run the scope when any of these change. */
  deps?: unknown[];
  /** Called instead of `setup` when prefers-reduced-motion is on — should
   *  synchronously apply the animation's final/settled state. */
  onReducedMotion?: (el: T) => void;
}

/**
 * Wraps anime.js's official React pattern (createScope + useRef + useEffect +
 * revert cleanup) with a single, shared prefers-reduced-motion gate, so every
 * animated component checks it once here instead of repeating the guard.
 */
export function useAnimeScope<T extends HTMLElement = HTMLDivElement>(
  setup: Setup,
  options?: UseAnimeScopeOptions<T>
): RefObject<T> {
  const root = useRef<T>(null);
  const scopeRef = useRef<Scope | null>(null);
  const reduced = usePrefersReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    if (reduced) {
      options?.onReducedMotion?.(el);
      return;
    }

    let extraCleanup: (() => void) | void;
    scopeRef.current = createScope({ root }).add((self) => {
      extraCleanup = setup(self as Scope);
    });

    return () => {
      extraCleanup?.();
      scopeRef.current?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, ...(options?.deps ?? [])]);

  return root;
}
