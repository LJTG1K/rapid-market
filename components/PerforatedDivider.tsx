import { animate } from 'animejs';
import { useAnimeScope } from '@/hooks/useAnimeScope';
import { scrollTrigger } from '@/lib/motion/scrollTrigger';

/**
 * The dashed "tear-line" divider (see .perforated in globals.css), animated
 * drawing itself in left-to-right via a clip-path wipe when scrolled into view.
 */
export default function PerforatedDivider({ className = '' }: { className?: string }) {
  const ref = useAnimeScope<HTMLDivElement>(
    () => {
      const el = ref.current;
      if (!el) return;
      const state = { p: 0 };
      animate(state, {
        p: 1,
        duration: 900,
        ease: 'outExpo',
        autoplay: scrollTrigger(el),
        onUpdate: () => {
          el.style.clipPath = `inset(0 ${(1 - state.p) * 100}% 0 0)`;
        },
      });
    },
    {
      onReducedMotion: (el) => {
        el.style.clipPath = 'none';
      },
    }
  );

  return <div ref={ref} className={`perforated ${className}`} />;
}
