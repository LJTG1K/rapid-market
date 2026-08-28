import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import StyleQuiz from './StyleQuiz';
import ProductMatchGrid from './ProductMatchGrid';
import {
  matchProducts,
  type QuizAnswers,
  type Product as MatchableProduct,
  type Brand,
  type MatchedProduct,
} from '@/lib/styleMatch';
import { getAnswers, saveAnswers, type StoredQuizAnswers } from '@/lib/styleQuizStorage';

function trackQuizEvent(type: string) {
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  }).catch(() => {});
}

interface StyleQuizSectionProps {
  className?: string;
  /** Fires once on mount (with the existing answer state) and again on completion. */
  onAnswersChange?: (hasAnswers: boolean) => void;
}

/**
 * Self-contained style quiz -> matched picks section: reads/writes localStorage
 * directly, so it needs no data from the page it's embedded in. Shared by the
 * post-signup screen and the account page. Callers control outer spacing/card
 * treatment via `className` since the two host pages style sections differently.
 */
export default function StyleQuizSection({ className = '', onAnswersChange }: StyleQuizSectionProps) {
  const [answers, setAnswers] = useState<StoredQuizAnswers | null | undefined>(undefined);
  const [matched, setMatched] = useState<MatchedProduct[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const onAnswersChangeRef = useRef(onAnswersChange);
  onAnswersChangeRef.current = onAnswersChange;

  useEffect(() => {
    const existing = getAnswers();
    setAnswers(existing);
    onAnswersChangeRef.current?.(!!existing);
  }, []);

  useEffect(() => {
    if (!answers) return;
    setLoadingMatches(true);
    Promise.all([
      fetch('/api/products?category=fashion').then((r) => r.json()) as Promise<MatchableProduct[]>,
      fetch('/data/brands.json').then((r) => r.json()) as Promise<Brand[]>,
    ])
      .then(([products, brands]) => setMatched(matchProducts(products, brands, answers)))
      .catch(() => setMatched([]))
      .finally(() => setLoadingMatches(false));
  }, [answers]);

  const handleComplete = (newAnswers: QuizAnswers) => {
    const stored = saveAnswers(newAnswers);
    setAnswers(stored);
    onAnswersChangeRef.current?.(true);
    fetch('/api/style-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAnswers),
    }).catch(() => {});
    trackQuizEvent('style-quiz-completed');
  };

  // Still checking localStorage — render nothing for a tick rather than flashing the quiz.
  if (answers === undefined) return null;

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between mb-8">
        <h2 className="font-display font-black text-2xl md:text-3xl tracking-tightest">
          {answers ? 'Your picks' : 'Get picks built around you'}
        </h2>
        {answers ? (
          <Link href="/style-quiz" className="eyebrow link-underline">Refine →</Link>
        ) : (
          <span className="eyebrow hidden sm:inline">3 Questions</span>
        )}
      </div>
      {answers ? (
        <ProductMatchGrid products={matched} loading={loadingMatches} />
      ) : (
        <StyleQuiz compact onComplete={handleComplete} />
      )}
    </div>
  );
}
