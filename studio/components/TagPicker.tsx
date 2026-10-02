import { useMemo, useRef, useState } from 'react';
import { normalizeTag } from '../lib/brands';

/**
 * Tags feed the style quiz (lib/styleMatch.ts), so the picker steers toward
 * the existing vocabulary: suggestions show how many brands use each tag, and
 * a tag nobody uses yet is marked "new" (SPEC.md § Brands).
 */
export function TagPicker({ value, onChange, vocabulary }: { value: string[]; onChange: (tags: string[]) => void; vocabulary: Map<string, number> }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = normalizeTag(query);
  const suggestions = useMemo(() => {
    const all = Array.from(vocabulary.entries()).filter(([t]) => !value.includes(t));
    const matched = q ? all.filter(([t]) => t.includes(q)) : all;
    return matched
      .sort((a, b) => Number(b[0].startsWith(q)) - Number(a[0].startsWith(q)) || b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8);
  }, [vocabulary, value, q]);
  const exact = vocabulary.has(q);
  const options: { tag: string; count: number | null }[] = [
    ...suggestions.map(([tag, count]) => ({ tag, count })),
    ...(q && !exact && !value.includes(q) ? [{ tag: q, count: null }] : []),
  ];

  function add(tag: string) {
    const t = normalizeTag(tag);
    if (t && !value.includes(t)) onChange([...value, t]);
    setQuery('');
    setActive(0);
    inputRef.current?.focus();
  }

  return (
    <div className="relative">
      <div
        className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 py-1.5 focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-900/5"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((t) => {
          const isNew = !vocabulary.has(t);
          return (
            <span
              key={t}
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${isNew ? 'border border-dashed border-accent/50 bg-white text-accent' : 'bg-accent-soft text-accent'}`}
              title={isNew ? 'New tag: no other brand uses it yet' : `${vocabulary.get(t)} brands use this tag`}
            >
              {t}
              {isNew && <span className="text-[10px] uppercase tracking-wide opacity-70">new</span>}
              <button type="button" className="ml-0.5 opacity-60 hover:opacity-100" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
                ×
              </button>
            </span>
          );
        })}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              if (options[active]) add(options[active].tag);
              else if (q) add(q);
            } else if (e.key === 'Backspace' && !query && value.length) {
              onChange(value.slice(0, -1));
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, options.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder={value.length ? '' : 'Add tags, e.g. minimal, streetwear…'}
          className="min-w-[140px] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-zinc-400"
        />
      </div>
      {open && options.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg">
          {options.map((o, i) => (
            <li key={o.tag}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(o.tag)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm ${i === active ? 'bg-zinc-100' : ''}`}
              >
                <span>{o.count === null ? <>Create new tag “<b>{o.tag}</b>”</> : o.tag}</span>
                <span className="text-xs text-zinc-400">{o.count === null ? 'new' : `${o.count} ${o.count === 1 ? 'brand' : 'brands'}`}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
