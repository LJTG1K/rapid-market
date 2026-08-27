import Head from 'next/head';
import { useEffect, useState } from 'react';
import Reveal from '@/components/Reveal';
import StyleQuiz from '@/components/StyleQuiz';
import ProductMatchGrid from '@/components/ProductMatchGrid';
import {
  matchProducts,
  STYLE_OPTIONS,
  BUDGET_OPTIONS,
  FIT_OPTIONS,
  type QuizAnswers,
  type Product,
  type Brand,
  type MatchedProduct,
} from '@/lib/styleMatch';
import { getAnswers, saveAnswers, clearAnswers, type StoredQuizAnswers } from '@/lib/styleQuizStorage';

function track(type: string) {
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  }).catch(() => {});
}

function persistToAccount(answers: QuizAnswers) {
  fetch('/api/style-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(answers),
  }).catch(() => {});
}

export default function StyleQuizPage() {
  const [answers, setAnswers] = useState<StoredQuizAnswers | null | undefined>(undefined);
  const [matched, setMatched] = useState<MatchedProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    const existing = getAnswers();
    setAnswers(existing);
    if (!existing) track('style-quiz-started');
  }, []);

  useEffect(() => {
    if (!answers) return;
    setLoadingProducts(true);
    Promise.all([
      fetch('/api/products?category=fashion').then((r) => r.json()) as Promise<Product[]>,
      fetch('/data/brands.json').then((r) => r.json()) as Promise<Brand[]>,
    ])
      .then(([products, brands]) => {
        setMatched(matchProducts(products, brands, answers));
      })
      .catch(() => setMatched([]))
      .finally(() => setLoadingProducts(false));
  }, [answers]);

  const handleComplete = (newAnswers: QuizAnswers) => {
    const stored = saveAnswers(newAnswers);
    setAnswers(stored);
    persistToAccount(newAnswers);
    track('style-quiz-completed');
  };

  const handleRetake = () => {
    clearAnswers();
    setAnswers(null);
    setMatched([]);
    track('style-quiz-started');
  };

  return (
    <>
      <Head>
        <title>Style Quiz — RAPID</title>
        <meta name="description" content="Three quick questions, then a browsing page built around what you'll actually buy." />
      </Head>

      <div className="container-edit py-16 md:py-24">
        {!answers ? (
          <Reveal>
            <span className="eyebrow block text-center mb-3">Find Your Picks</span>
            <StyleQuiz onComplete={handleComplete} />
          </Reveal>
        ) : (
          <Reveal>
            <div className="flex items-baseline justify-between mb-2">
              <span className="eyebrow">Your Picks</span>
              <button
                type="button"
                onClick={handleRetake}
                className="link-underline font-mono text-xs uppercase tracking-wide"
              >
                Retake quiz
              </button>
            </div>
            <h1 className="font-display font-black text-ink text-5xl md:text-6xl tracking-tightest leading-[0.9] mb-6">
              Built Around You
            </h1>

            <div className="flex flex-wrap gap-2 mb-12">
              {answers.styles.map((s) => (
                <span key={s} className="tag">{STYLE_OPTIONS.find((o) => o.key === s)?.label}</span>
              ))}
              <span className="tag">{BUDGET_OPTIONS.find((o) => o.key === answers.budget)?.label}</span>
              <span className="tag">{FIT_OPTIONS.find((o) => o.key === answers.fit)?.label}</span>
            </div>

            <ProductMatchGrid products={matched} loading={loadingProducts} />
          </Reveal>
        )}
      </div>
    </>
  );
}
