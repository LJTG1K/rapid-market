import { useCallback, useEffect, useState } from 'react';
import { DiffList } from '../components/DiffList';
import { Layout } from '../components/Layout';
import { useStudio } from '../components/StudioContext';
import { Badge, Button, Modal, Spinner } from '../components/ui';
import { api, timeAgo } from '../lib/client';
import { targetLabel } from '../lib/targets';
import type { Change, Publish } from '../lib/types';

type Entry = Publish & { changes: Change[]; commitUrl: string | null };

function groupByTarget(changes: Change[]) {
  const m = new Map<string, Change[]>();
  changes.forEach((c) => {
    const label = targetLabel(c.targetType, c.targetKey);
    m.set(label, [...(m.get(label) ?? []), c]);
  });
  return Array.from(m.entries());
}

export default function HistoryPage() {
  const { refreshStatus, showToast, bumpContent } = useStudio();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Entry | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ skipped: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ publishes: Entry[] }>('/api/history')
      .then((r) => setEntries(r.publishes))
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function revert(entry: Entry) {
    setConfirm(null);
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ skipped: string[]; publish: Publish | null }>('/api/revert', { method: 'POST', body: { publishId: entry.id } });
      setResult({ skipped: r.skipped });
      showToast(r.publish ? 'Publish reverted' : 'Nothing to revert: everything had changed since');
      load();
      bumpContent();
      refreshStatus().catch(() => {});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout title="History">
      <p className="mb-4 max-w-2xl text-sm text-zinc-500">
        Every publish, newest first. Reverting undoes the most recent publish. Any field that someone has edited again since is left alone and listed.
      </p>
      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
      {result && result.skipped.length > 0 && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <div className="mb-1 font-semibold">Some changes weren&apos;t reverted:</div>
          <ul>{result.skipped.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
      {!entries && !error && (
        <div className="flex items-center gap-2 py-20 text-sm text-zinc-500">
          <Spinner /> Loading…
        </div>
      )}
      {entries && !entries.length && <div className="py-20 text-center text-sm text-zinc-500">Nothing has been published from Studio yet.</div>}
      {entries && entries.length > 0 && (
        <ol className="divide-y divide-zinc-100 overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {entries.map((e, i) => {
            const canRevert = i === 0 && !e.revertedBy;
            return (
              <li key={e.id}>
                <div className="flex items-center gap-4 px-5 py-3.5">
                  <button onClick={() => setOpen(open === e.id ? null : e.id)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-medium text-zinc-900">{e.summary}</span>
                      {e.revertOf && <Badge>Revert</Badge>}
                      {e.revertedBy && <Badge tone="delete">Reverted</Badge>}
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-500">
                      {e.editorName} · {timeAgo(e.createdAt)} · {e.changes.length} field {e.changes.length === 1 ? 'change' : 'changes'}
                    </div>
                  </button>
                  {e.commitUrl ? (
                    <a href={e.commitUrl} target="_blank" rel="noreferrer" className="font-mono text-xs text-zinc-500 hover:text-zinc-900">
                      {e.commitSha.slice(0, 7)} ↗
                    </a>
                  ) : (
                    <span className="text-xs text-zinc-400">local</span>
                  )}
                  {canRevert && (
                    <Button size="sm" onClick={() => setConfirm(e)} disabled={busy}>
                      {busy ? <Spinner /> : 'Revert'}
                    </Button>
                  )}
                </div>
                {open === e.id && (
                  <div className="space-y-4 border-t border-zinc-100 bg-zinc-50/60 px-5 py-4">
                    {groupByTarget(e.changes).map(([key, changes]) => (
                      <div key={key}>
                        <div className="mb-2 text-xs font-semibold text-zinc-700">{key}</div>
                        <DiffList diffs={changes} />
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Revert this publish?"
        footer={
          <>
            <Button onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => confirm && revert(confirm)}>
              Revert
            </Button>
          </>
        }
      >
        “{confirm?.summary}” will be undone with a new commit, and the site redeploys. Fields edited again since are left alone.
      </Modal>
    </Layout>
  );
}
