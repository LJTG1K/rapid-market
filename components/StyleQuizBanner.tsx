import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

// Constant/sitewide by design — shown on every route, including /signup and
// /campaign, except the quiz's own page (redundant there). Not gated on
// localStorage (dismissed/already-answered) so it never silently disappears;
// dismissing only hides it for the current page view, not future ones.
const HIDDEN_ON = ['/style-quiz'];

export default function StyleQuizBanner() {
  const router = useRouter();
  const [dismissedThisView, setDismissedThisView] = useState(false);

  if (dismissedThisView || HIDDEN_ON.includes(router.pathname)) return null;

  const handleDismiss = () => {
    setDismissedThisView(true);
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'style-quiz-banner-dismissed' }),
    }).catch(() => {});
  };

  return (
    <div className="bg-paper border-b border-line">
      <div className="container-edit flex items-center justify-between gap-4 py-2.5">
        <Link href="/style-quiz" className="group flex items-center gap-2.5 min-w-0">
          <span className="font-mono text-[11px] text-stamp shrink-0">01/02/03</span>
          <span className="text-sm text-ink/80 truncate">
            <span className="font-semibold text-ink group-hover:text-stamp transition-colors">Find pieces you&apos;ll actually buy</span>
            {' '}— 3 questions, 30 seconds →
          </span>
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-ink/40 hover:text-ink transition-colors font-mono text-lg leading-none px-1"
        >
          ×
        </button>
      </div>
    </div>
  );
}
