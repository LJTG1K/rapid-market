import { onScroll, ScrollObserver } from 'animejs';

/**
 * Shared "when does this animation play" logic for every scroll-triggered
 * motion component. Mirrors the old Reveal component's IntersectionObserver
 * config (threshold:0, rootMargin '0px 0px -40px 0px') via onScroll's
 * `enter: 'bottom-=40 top'` — a single-edge crossing, so the tall-grid bug
 * that threshold:0 was written to fix (a percentage of a very tall element
 * may never be simultaneously visible) cannot recur here.
 *
 * Also replicates IntersectionObserver's "fires immediately if already
 * intersecting on observe()" behaviour, which ScrollObserver's docs don't
 * explicitly promise — checked manually so above-the-fold content (hero
 * headlines, a signup success card) animates on load rather than waiting
 * for a scroll event that may never come.
 */
export function scrollTrigger(target: Element): boolean | ScrollObserver {
  const rect = target.getBoundingClientRect();
  const alreadyVisible = rect.top < window.innerHeight - 40 && rect.bottom > 0;
  return alreadyVisible ? true : onScroll({ target, enter: 'bottom-=40 top' });
}
