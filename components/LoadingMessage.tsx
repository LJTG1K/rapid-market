import { useEffect, useRef, useState } from 'react';

// On-brand loading microcopy — customs / manifest / shipping vocabulary that
// matches RAPID's editorial identity. Shown while listing data fetches so the
// wait reads as intentional rather than dead air.
export const MANIFEST_MESSAGES = [
  'Scanning the manifest…',
  'Clearing customs…',
  'Sorting 100+ sellers…',
  "Indexing today's drops…",
  'Pulling from the index…',
  'Tallying the ledger…',
  'Consolidating your haul…',
  'Checking the warehouse…',
  'Stamping the QC seal…',
  'Loading seller photos…',
];

// View-specific flavour. Each set leads with its own lines, then falls back to
// the general manifest lines so the rotation still has depth.
export const CATEGORY_MESSAGES: Record<'fashion' | 'tech' | 'gillys', string[]> = {
  fashion: [
    'Sorting the rails…',
    'Steaming the fits…',
    'Loading seller photos…',
    ...MANIFEST_MESSAGES,
  ],
  tech: [
    'Powering up the bench…',
    'Bagging the gear…',
    'Loading seller photos…',
    ...MANIFEST_MESSAGES,
  ],
  gillys: [
    'Digging through the crates…',
    "Pulling Gilly's picks…",
    'Loading seller photos…',
    ...MANIFEST_MESSAGES,
  ],
};

interface LoadingMessageProps {
  messages?: string[];
  intervalMs?: number;
  className?: string;
}

export default function LoadingMessage({
  messages = MANIFEST_MESSAGES,
  intervalMs = 1400,
  className = '',
}: LoadingMessageProps) {
  const [index, setIndex] = useState(0);
  // Start from a random line so repeated loads don't always open the same way.
  const startRef = useRef(false);

  useEffect(() => {
    if (!startRef.current) {
      startRef.current = true;
      setIndex(Math.floor(Math.random() * messages.length));
    }

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || messages.length <= 1) return;

    const id = setInterval(() => {
      setIndex((n) => (n + 1) % messages.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [messages, intervalMs]);

  return (
    <div
      className={`flex items-center gap-2.5 font-mono text-xs uppercase tracking-widest text-muted ${className}`}
      role="status"
    >
      <span
        className="w-1.5 h-1.5 rounded-full bg-stamp motion-safe:animate-pulse shrink-0"
        aria-hidden="true"
      />
      {/* Rotating text is decorative motion; keep the SR announcement stable. */}
      <span key={index} className="motion-safe:animate-[fadeIn_0.4s_ease]" aria-hidden="true">
        {messages[index]}
      </span>
      <span className="sr-only">Loading products…</span>
    </div>
  );
}
