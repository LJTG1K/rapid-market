import { useEffect, useRef, useState, ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'section';
}

/**
 * Fades/rises content in once it enters the viewport. Backed by the
 * .reveal / .is-visible CSS in globals.css, which is a no-op under
 * prefers-reduced-motion.
 */
export default function Reveal({ children, className = '', delay = 0, as = 'div' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // threshold: 0 — fires as soon as any part of the element is on screen.
      // A percentage threshold breaks on tall wrapped content (e.g. a grid of
      // 100+ product cards): a % of a very tall element may never be
      // simultaneously visible in one viewport, so it would never reveal.
      { threshold: 0, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = as;

  return (
    <Tag
      ref={ref as any}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
