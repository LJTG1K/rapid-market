import { useState } from 'react';
import PerforatedDivider from './PerforatedDivider';
import {
  STYLE_OPTIONS,
  BUDGET_OPTIONS,
  FIT_OPTIONS,
  type StyleKey,
  type BudgetKey,
  type FitKey,
  type QuizAnswers,
} from '@/lib/styleMatch';

interface StyleQuizProps {
  onComplete: (answers: QuizAnswers) => void;
  /** Smaller variant for embedding inline (e.g. post-signup) vs. the full-bleed standalone page. */
  compact?: boolean;
}

const STEP_TITLES = ["What's your style?", "What's your budget?", 'Sizing and fit?'];
const STEP_SUB = [
  'Pick as many as apply.',
  'How you like to spend.',
  'How you like your clothes to sit.',
];

function Tile({
  active,
  label,
  sub,
  onClick,
}: {
  active: boolean;
  label: string;
  sub?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`w-full text-left px-5 py-4 border transition-colors ${
        active ? 'border-stamp bg-stamp/[0.06] text-ink' : 'border-line bg-paper text-ink/80 hover:border-ink/40'
      }`}
    >
      <span className="block font-display font-black text-base leading-snug">{label}</span>
      {sub && <span className="block font-mono text-[11px] text-muted mt-1 uppercase tracking-wide">{sub}</span>}
    </button>
  );
}

export default function StyleQuiz({ onComplete, compact = false }: StyleQuizProps) {
  const [step, setStep] = useState(0);
  const [styles, setStyles] = useState<StyleKey[]>([]);
  const [budget, setBudget] = useState<BudgetKey | null>(null);
  const [fit, setFit] = useState<FitKey | null>(null);

  const toggleStyle = (key: StyleKey) => {
    setStyles((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  };

  const canAdvance = step === 0 ? styles.length > 0 : step === 1 ? !!budget : !!fit;

  const handleNext = () => {
    if (!canAdvance) return;
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    onComplete({ styles, budget: budget as BudgetKey, fit: fit as FitKey });
  };

  return (
    <div className={compact ? 'max-w-md mx-auto' : 'max-w-lg mx-auto'}>
      <div className="flex items-center justify-center gap-3 mb-6">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`font-mono text-xs ${i === step ? 'text-stamp' : i < step ? 'text-ink/50' : 'text-muted/60'}`}>
            {String(i + 1).padStart(2, '0')}
          </span>
        ))}
      </div>

      <h2 className="font-display font-black text-ink text-3xl md:text-4xl tracking-tightest text-center leading-[0.95] mb-2">
        {STEP_TITLES[step]}
      </h2>
      <p className="text-ink/60 text-sm text-center mb-8">{STEP_SUB[step]}</p>

      {step === 0 && (
        <div className="flex flex-col gap-3 mb-8">
          {STYLE_OPTIONS.map((opt) => (
            <Tile key={opt.key} active={styles.includes(opt.key)} label={opt.label} onClick={() => toggleStyle(opt.key)} />
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-3 mb-8">
          {BUDGET_OPTIONS.map((opt) => (
            <Tile key={opt.key} active={budget === opt.key} label={opt.label} onClick={() => setBudget(opt.key)} />
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3 mb-8">
          {FIT_OPTIONS.map((opt) => (
            <Tile key={opt.key} active={fit === opt.key} label={opt.label} onClick={() => setFit(opt.key)} />
          ))}
        </div>
      )}

      <PerforatedDivider className="mb-6" />

      <div className="flex items-center justify-between gap-4">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="font-mono text-xs uppercase tracking-wide text-ink/60 hover:text-ink transition-colors"
          >
            ← Back
          </button>
        ) : (
          <span />
        )}
        <button type="button" onClick={handleNext} disabled={!canAdvance} className="btn-stamp disabled:opacity-40">
          {step < 2 ? 'Next' : 'See My Picks →'}
        </button>
      </div>
    </div>
  );
}
