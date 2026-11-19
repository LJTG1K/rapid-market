import { useState } from 'react';
import ProductImage from './ProductImage';
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
  /**
   * Optional photo per style option. When given (even empty, while loading), step 1 shows photo tiles
   * instead of text rows, so the first tap happens before any reading
   * (used by the Reddit landing page).
   */
  styleImages?: Partial<Record<StyleKey, string>>;
}

const STEP_TITLES = ["What's your style?", "What's your budget?", 'Sizing and fit?'];
const STEP_SUB = ['Pick as many as apply.', 'How you like to spend.', 'How you like your clothes to sit.'];

function Check({ on }: { on: boolean }) {
  return (
    <span
      className={`w-5 h-5 rounded-full grid place-items-center shrink-0 border ${on ? 'bg-ink border-ink' : 'border-line bg-white'}`}
      aria-hidden="true"
    >
      {on && (
        <svg width="10" height="10" viewBox="0 0 12 12">
          <path d="M3 6.2l2 2 4-4.2" stroke="#fff" strokeWidth="1.8" fill="none" />
        </svg>
      )}
    </span>
  );
}

function Tile({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`w-full flex items-center justify-between gap-3 text-left px-4 py-3.5 rounded-xl border transition-colors ${
        active ? 'border-ink bg-paper' : 'border-line bg-white hover:border-ink/40'
      }`}
    >
      <span className="font-semibold text-[15px] text-ink">{label}</span>
      <Check on={active} />
    </button>
  );
}

function PhotoTile({ active, label, image, onClick }: { active: boolean; label: string; image?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className="group text-left">
      <span
        className={`relative block aspect-[3/4] rounded-xl overflow-hidden bg-paper transition-shadow ${
          active ? 'ring-[3px] ring-ink ring-offset-2' : 'group-hover:ring-1 group-hover:ring-ink/30'
        }`}
      >
        {image ? <ProductImage src={image} alt="" priority /> : <span className="absolute inset-0 motion-safe:animate-pulse bg-paper" />}
        <span className="absolute top-2 right-2"><Check on={active} /></span>
      </span>
      <span className="block mt-2 font-semibold text-[15px] text-ink">{label}</span>
    </button>
  );
}

export default function StyleQuiz({ onComplete, compact = false, styleImages }: StyleQuizProps) {
  const [step, setStep] = useState(0);
  const [styles, setStyles] = useState<StyleKey[]>([]);
  const [budget, setBudget] = useState<BudgetKey | null>(null);
  const [fit, setFit] = useState<FitKey | null>(null);

  const toggleStyle = (key: StyleKey) => {
    setStyles((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  };

  const canAdvance = step === 0 ? styles.length > 0 : step === 1 ? !!budget : !!fit;
  // Photo layout whenever the page asks for it; tiles show a placeholder
  // until their photo arrives, so the layout never switches mid-load.
  const usePhotos = !!styleImages;

  const handleNext = () => {
    if (!canAdvance) return;
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    onComplete({ styles, budget: budget as BudgetKey, fit: fit as FitKey });
  };

  return (
    <div className={usePhotos && step === 0 ? 'max-w-2xl mx-auto' : compact ? 'max-w-md mx-auto' : 'max-w-lg mx-auto'}>
      <div className="flex items-center justify-center gap-1.5 mb-5" aria-label={`Question ${step + 1} of 3`}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-1 w-8 rounded-full ${i <= step ? 'bg-ink' : 'bg-line'}`} />
        ))}
      </div>

      <h2 className="font-display text-ink text-2xl md:text-3xl text-center leading-tight mb-1.5">{STEP_TITLES[step]}</h2>
      <p className="text-muted text-sm text-center mb-6">
        {step + 1} of 3 · {STEP_SUB[step]}
      </p>

      {step === 0 &&
        (usePhotos ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
            {STYLE_OPTIONS.map((opt) => (
              <PhotoTile
                key={opt.key}
                active={styles.includes(opt.key)}
                label={opt.label}
                image={styleImages![opt.key]}
                onClick={() => toggleStyle(opt.key)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 mb-7">
            {STYLE_OPTIONS.map((opt) => (
              <Tile key={opt.key} active={styles.includes(opt.key)} label={opt.label} onClick={() => toggleStyle(opt.key)} />
            ))}
          </div>
        ))}

      {step === 1 && (
        <div className="flex flex-col gap-2.5 mb-7">
          {BUDGET_OPTIONS.map((opt) => (
            <Tile key={opt.key} active={budget === opt.key} label={opt.label} onClick={() => setBudget(opt.key)} />
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-2.5 mb-7">
          {FIT_OPTIONS.map((opt) => (
            <Tile key={opt.key} active={fit === opt.key} label={opt.label} onClick={() => setFit(opt.key)} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        {step > 0 ? (
          <button type="button" onClick={() => setStep(step - 1)} className="text-sm font-medium text-muted hover:text-ink transition-colors">
            ← Back
          </button>
        ) : (
          <span />
        )}
        <button type="button" onClick={handleNext} disabled={!canAdvance} className="btn-primary disabled:opacity-40">
          {step < 2 ? 'Next question' : 'See my picks'}
        </button>
      </div>
    </div>
  );
}
