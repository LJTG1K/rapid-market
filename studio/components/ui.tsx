import { useEffect, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'publish';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-zinc-900 text-white hover:bg-zinc-800 disabled:bg-zinc-300',
  secondary: 'bg-white text-zinc-800 border border-zinc-200 hover:bg-zinc-50 disabled:text-zinc-400',
  ghost: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
  danger: 'bg-white text-red-700 border border-red-200 hover:bg-red-50',
  // Stamp red is reserved for Publish (SPEC.md § Design).
  publish: 'bg-stamp text-white hover:bg-stamp-dark disabled:bg-zinc-300 shadow-sm',
};

export function Button({ variant = 'secondary', size = 'md', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  return (
    <button
      {...props}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed',
        size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-9 px-3.5 text-sm',
        VARIANTS[variant],
        className,
      )}
    />
  );
}

const fieldBase =
  'w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 disabled:bg-zinc-50 disabled:text-zinc-500';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(fieldBase, 'h-9', className)} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(fieldBase, 'py-2 leading-relaxed', className)} />;
}

export function Field({ label, hint, children, aside }: { label: string; hint?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-zinc-800">{label}</span>
        {aside && <span className="text-xs text-zinc-400">{aside}</span>}
      </div>
      {children}
      {hint && <div className="mt-1.5 text-xs text-zinc-500">{hint}</div>}
    </label>
  );
}

const BADGES = {
  neutral: 'bg-zinc-100 text-zinc-600',
  create: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  update: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200',
  delete: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
  accent: 'bg-accent-soft text-accent',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: keyof typeof BADGES; children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium', BADGES[tone], className)}>{children}</span>;
}

export const OP_LABEL = { create: 'New', update: 'Edited', delete: 'Deleting' } as const;

export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} className="w-[440px] rounded-xl border border-zinc-200 p-0 shadow-2xl backdrop:bg-zinc-900/30">
      <div className="p-5">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        <div className="mt-2 text-sm text-zinc-600">{children}</div>
      </div>
      <div className="flex justify-end gap-2 border-t border-zinc-100 bg-zinc-50 px-5 py-3">{footer}</div>
    </dialog>
  );
}

export function Spinner() {
  return <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />;
}

export { cx };
