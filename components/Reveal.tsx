import { ReactNode } from 'react';
import { animate, stagger as animeStagger } from 'animejs';
import { useAnimeScope } from '@/hooks/useAnimeScope';
import { scrollTrigger } from '@/lib/motion/scrollTrigger';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'section';
  /** ms between items; when set, staggers direct children individually
   *  instead of fading the wrapper as one block (used by product grids). */
  stagger?: number;
}

/**
 * Fades/rises content in once it enters the viewport, powered by anime.js's
 * ScrollObserver. Backed by the .reveal-init CSS in globals.css, which is a
 * no-op under prefers-reduced-motion.
 */
export default function Reveal({ children, className = '', delay = 0, as = 'div', stagger }: RevealProps) {
  const ref = useAnimeScope<HTMLElement>(
    () => {
      const el = ref.current;
      if (!el) return;
      const targets = stagger ? Array.from(el.children) : el;
      animate(targets, {
        opacity: [0, 1],
        y: [18, 0],
        duration: 700,
        ease: 'outExpo',
        delay: stagger ? animeStagger(stagger, { start: delay }) : delay,
        autoplay: scrollTrigger(el),
      });
    },
    {
      deps: [stagger, delay],
      onReducedMotion: (el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      },
    }
  );

  const Tag = as as any;

  return (
    <Tag ref={ref} className={`${stagger ? '' : 'reveal-init'} ${className}`}>
      {children}
    </Tag>
  );
}
