import { animate, stagger, splitText } from 'animejs';
import { useAnimeScope } from '@/hooks/useAnimeScope';
import { scrollTrigger } from '@/lib/motion/scrollTrigger';

interface SplitHeadlineProps {
  /** Plain text only — splitText needs a stable text node to split. */
  children: string;
  as?: 'h1' | 'h2' | 'span';
  className?: string;
  by?: 'words' | 'chars';
}

/**
 * Splits a headline into words/chars and staggers them in on scroll-into-view.
 * Anime.js's TextSplitter is auto-registered with the enclosing scope (same as
 * animate()/onScroll()), so scope.revert() in useAnimeScope's cleanup already
 * tears the split spans back down — no manual revert needed here.
 */
export default function SplitHeadline({ children, as = 'h1', className = '', by = 'words' }: SplitHeadlineProps) {
  const ref = useAnimeScope<HTMLElement>(
    () => {
      const el = ref.current;
      if (!el) return;
      const split =
        by === 'words'
          ? splitText(el, { words: true, accessible: true })
          : splitText(el, { chars: true, accessible: true });
      // The wrapper's .split-init opacity:0 only exists to hide the unsplit
      // text pre-JS; once split, each word/char controls its own opacity, so
      // the wrapper itself needs to be visible again.
      el.style.opacity = '1';
      const targets = by === 'words' ? split.words : split.chars;
      animate(targets, {
        y: ['110%', '0%'],
        opacity: [0, 1],
        duration: 700,
        ease: 'outExpo',
        delay: stagger(by === 'words' ? 60 : 18),
        autoplay: scrollTrigger(el),
      });
    },
    {
      deps: [children, by],
      onReducedMotion: (el) => {
        el.style.opacity = '1';
      },
    }
  );

  const Tag = as as any;

  return (
    <Tag ref={ref} className={`split-init ${className}`}>
      {children}
    </Tag>
  );
}
