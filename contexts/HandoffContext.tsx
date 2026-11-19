import { createContext, useCallback, useContext, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import Link from 'next/link';
import ProductImage from '@/components/ProductImage';
import { useAuth } from '@/contexts/AuthContext';
import { trackBuyClick } from '@/lib/tracking';
import { gillyNoteFor, isGillyPick } from '@/lib/gillyPicks';
import { lastSignInMethod } from '@/lib/signInMethod';

/**
 * The RAPID -> Sugargoo handoff. A buy click opens this sheet instead of
 * leaving straight away: it shows the item, what happens next, and (for
 * logged-out shoppers) offers RAPID's instant signup first, since signups
 * through RAPID's invitation link are how RAPID earns.
 *
 * Tracking: trackBuyClick fires when the shopper actually exits to Sugargoo
 * (the Continue link), not when the sheet opens.
 *
 * Frequency: a shopper's first FULL_VIEWS sheets are the full card; after
 * that a compact one-line version, so repeat buyers aren't slowed down.
 */

export interface HandoffProduct {
  id: string;
  name: string;
  image: string;
  price: string;
  sugargooLink: string;
  gillyNote?: string;
  brand?: string;
  itemName?: string;
}

interface HandoffOptions {
  /** Extra work to run on the actual exit, e.g. a page's own /api/track log. */
  onExit?: (eventId: string) => void;
}

interface HandoffContextValue {
  /** onClick handler for any <a href={sugargooLink}> buy link. */
  handleBuyClick: (e: MouseEvent<HTMLAnchorElement>, product: HandoffProduct, opts?: HandoffOptions) => void;
}

const HandoffContext = createContext<HandoffContextValue | undefined>(undefined);

const FULL_VIEWS = 3;
const SEEN_KEY = 'rapid_handoff_seen';

function readSeen(): number {
  try {
    return Number(window.localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeSeen(n: number) {
  try {
    window.localStorage.setItem(SEEN_KEY, String(n));
  } catch {
    // storage blocked: every sheet stays full, which is fine
  }
}

export function HandoffProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ product: HandoffProduct; opts?: HandoffOptions; compact: boolean } | null>(null);

  const handleBuyClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, product: HandoffProduct, opts?: HandoffOptions) => {
      // Cmd/Ctrl/Shift/middle-click: the shopper chose to open it themselves.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) {
        const id = trackBuyClick({ productId: product.id, productName: product.name });
        opts?.onExit?.(id);
        return;
      }
      e.preventDefault();
      const seen = readSeen();
      writeSeen(seen + 1);
      setState({ product, opts, compact: seen >= FULL_VIEWS });
    },
    []
  );

  return (
    <HandoffContext.Provider value={{ handleBuyClick }}>
      {children}
      {state && <HandoffSheet {...state} onClose={() => setState(null)} />}
    </HandoffContext.Provider>
  );
}

export function useHandoff(): HandoffContextValue {
  const ctx = useContext(HandoffContext);
  if (!ctx) throw new Error('useHandoff must be used inside HandoffProvider');
  return ctx;
}

function HandoffSheet({
  product,
  opts,
  compact,
  onClose,
}: {
  product: HandoffProduct;
  opts?: HandoffOptions;
  compact: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const primaryRef = useRef<HTMLAnchorElement>(null);
  const returnFocus = useRef<Element | null>(null);
  const pick = isGillyPick(product.id);
  // Google users never typed a password for RAPID, so "same email and
  // password" would confuse them; point them at the Sugargoo login they got.
  const viaGoogle = lastSignInMethod() === 'google';
  const note = gillyNoteFor(product);

  useEffect(() => {
    returnFocus.current = document.activeElement;
    primaryRef.current?.focus();
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      (returnFocus.current as HTMLElement | null)?.focus?.();
    };
  }, [onClose]);

  const exit = () => {
    const id = trackBuyClick({ productId: product.id, productName: product.name });
    opts?.onExit?.(id);
    // Let the link open its new tab before the sheet unmounts.
    setTimeout(onClose, 0);
  };

  const continueLink = (label: string, className: string, ref?: React.Ref<HTMLAnchorElement>) => (
    <a ref={ref} href={product.sugargooLink} target="_blank" rel="noopener noreferrer" onClick={exit} className={className}>
      {label}
    </a>
  );

  // /signup has no return-to support yet, so the shopper lands on its own
  // "what happens next" screen after signing up.
  const signupHref = '/signup';

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6" role="presentation">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 motion-safe:animate-[fadeIn_150ms_ease-out]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="handoff-title"
        className="relative w-full sm:max-w-[460px] bg-white border border-line rounded-t-2xl sm:rounded-2xl shadow-[0_24px_60px_-20px_rgba(14,14,16,0.35)] p-5 sm:p-6 grid gap-4"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-9 h-9 rounded-full grid place-items-center text-muted hover:text-ink hover:bg-paper"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" /></svg>
        </button>

        {compact ? (
          <>
            <p id="handoff-title" className="pr-10 text-[15px] leading-snug">
              <b className="font-semibold">Heading to Sugargoo.</b>{' '}
              {user ? (viaGoogle ? `Log in as ${user.email}.` : 'Same login as RAPID.') : (
                <>No account yet? <Link href={signupHref} onClick={onClose} className="link-underline">Create one free</Link>.</>
              )}
            </p>
            {continueLink('Continue to Sugargoo', 'btn-stamp w-full', primaryRef)}
          </>
        ) : (
          <>
            <h2 id="handoff-title" className="font-display text-[26px] leading-tight pr-10">
              Off you go to Sugargoo.
            </h2>
            <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3.5 items-center">
              <div className="relative w-[72px] h-[90px] rounded-md overflow-hidden bg-paper">
                <ProductImage src={product.image} alt={product.name} />
              </div>
              <div className="min-w-0">
                {product.brand && <p className="text-[11.5px] uppercase tracking-[0.06em] text-muted">{product.brand}</p>}
                <p className="font-semibold leading-snug line-clamp-2">{product.itemName || product.name}</p>
                <p className="text-sm text-muted">
                  <span className="font-mono">{product.price}</span> before shipping
                </p>
                {pick && <p className="gilly-note !text-[19px] mt-0.5">good pick. — G.</p>}
              </div>
            </div>
            <ol className="grid gap-2.5">
              {[
                user
                  ? viaGoogle
                    ? `Buy it on Sugargoo, logged in as ${user.email}. Your Sugargoo password was in your signup email.`
                    : 'Buy it on Sugargoo. Same email and password as RAPID.'
                  : 'Create a free account through RAPID first. It takes about 30 seconds and logs you into Sugargoo.',
                note
                  ? "The warehouse sends you photos. Check them against Gilly's note."
                  : 'The warehouse sends you photos. Check them before it ships.',
                "Ship it with anything else you've bought, in one box.",
              ].map((step, i) => (
                <li key={i} className="grid grid-cols-[26px_minmax(0,1fr)] gap-2.5 text-[14.5px] leading-snug">
                  <span className="w-6 h-6 rounded-full bg-hi grid place-items-center text-xs font-semibold">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            {user ? (
              continueLink('Continue to Sugargoo', 'btn-stamp w-full sm:w-auto sm:justify-self-start', primaryRef)
            ) : (
              <div className="grid gap-3">
                <Link ref={primaryRef} href={signupHref} onClick={onClose} className="btn-primary w-full">
                  Create your free account
                </Link>
                {continueLink('I already use Sugargoo, continue →', 'justify-self-center text-sm font-medium link-underline')}
              </div>
            )}
            <p className="text-[12.5px] text-muted leading-snug">
              New to buying through an agent?{' '}
              <Link href="/tutorial" onClick={onClose} className="link-underline">See how it works</Link>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
