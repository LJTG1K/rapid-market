import { FIELD_LABELS } from '../lib/client';
import type { FieldDiff } from '../lib/types';

function Value({ v, tone }: { v: unknown; tone: 'old' | 'new' }) {
  const cls = tone === 'old' ? 'text-zinc-400 line-through decoration-zinc-300' : 'text-zinc-900';
  if (v == null || v === '') return <span className="italic text-zinc-400">empty</span>;
  if (Array.isArray(v)) {
    return (
      <span className="flex flex-wrap gap-1">
        {v.map((t) => (
          <span key={String(t)} className={`rounded px-1.5 py-0.5 text-[11px] ${tone === 'old' ? 'bg-zinc-100 text-zinc-400 line-through' : 'bg-accent-soft text-accent'}`}>
            {String(t)}
          </span>
        ))}
      </span>
    );
  }
  return <span className={`${cls} whitespace-pre-wrap break-words`}>{String(v)}</span>;
}

/** Tags diff shown as added / removed chips rather than two full lists. */
function TagDiff({ oldValue, newValue }: { oldValue: unknown; newValue: unknown }) {
  const before = new Set((oldValue as string[]) ?? []);
  const after = new Set((newValue as string[]) ?? []);
  const added = Array.from(after).filter((t) => !before.has(t));
  const removed = Array.from(before).filter((t) => !after.has(t));
  return (
    <span className="flex flex-wrap gap-1">
      {added.map((t) => (
        <span key={`+${t}`} className="rounded bg-accent-soft px-1.5 py-0.5 text-[11px] text-accent">+ {t}</span>
      ))}
      {removed.map((t) => (
        <span key={`-${t}`} className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-400 line-through">{t}</span>
      ))}
    </span>
  );
}

export function DiffList({ diffs, compact }: { diffs: FieldDiff[]; compact?: boolean }) {
  return (
    <dl className="space-y-2">
      {diffs.map((d) => (
        <div key={d.field} className="grid grid-cols-[96px_1fr] gap-2 text-xs">
          <dt className="pt-0.5 text-zinc-500">{FIELD_LABELS[d.field] ?? d.field}</dt>
          <dd className="space-y-1">
            {d.field === '__record' ? (
              <span className="text-zinc-700">{d.newValue ? 'Created' : 'Deleted'}</span>
            ) : d.field === 'aesthetic' && d.oldValue != null ? (
              <TagDiff oldValue={d.oldValue} newValue={d.newValue} />
            ) : (
              <>
                {d.oldValue != null && !compact && <div><Value v={d.oldValue} tone="old" /></div>}
                <div><Value v={d.newValue} tone="new" /></div>
              </>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
