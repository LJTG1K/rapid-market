import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getAnswers, isDismissed, dismissBanner } from '@/lib/styleQuizStorage';

// Routes where the quiz is already front-and-center (or nav itself is stripped) —
// the banner would just be noise here.
const HIDDEN_ON = ['/style-quiz', '/signup', '/campaign'];

export default function StyleQuizBanner() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!getAnswers() && !isDismissed());
  }, []);

  if (!visible || HIDDEN_ON.includes(router.pathname)) return null;

  const handleDismiss = () => {
    dismissBanner();
    setVisible(false);
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
