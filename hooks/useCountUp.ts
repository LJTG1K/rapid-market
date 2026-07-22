import { animate } from 'animejs';
import { useAnimeScope } from './useAnimeScope';
import { scrollTrigger } from '@/lib/motion/scrollTrigger';
import { parseNumericValue, ParsedStat } from '@/lib/motion/parseNumericValue';

function formatStat(n: number, parsed: ParsedStat): string {
  const rounded = n.toFixed(parsed.decimals);
  const withCommas = rounded.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${parsed.prefix}${withCommas}${parsed.suffix}`;
}

/** Tweens a plain number and writes it to a DOM node's textContent on each
 *  tick, scroll-triggered. Returns null `parsed` for non-numeric values so
 *  callers (CountUp) can fall back to rendering the raw string statically. */
export function useCountUp<T extends HTMLElement = HTMLSpanElement>(
  value: string,
  opts?: { duration?: number }
) {
  const parsed = parseNumericValue(value);

  const ref = useAnimeScope<T>(
    () => {
      const el = ref.current;
      if (!el || !parsed) return;
      const state = { n: 0 };
      animate(state, {
        n: parsed.number,
        duration: opts?.duration ?? 1400,
        ease: 'outExpo',
        autoplay: scrollTrigger(el),
        onUpdate: () => {
          el.textContent = formatStat(state.n, parsed);
        },
      });
    },
    {
      deps: [value],
      onReducedMotion: (el) => {
        el.textContent = value;
      },
    }
  );

  return { ref, parsed };
}
