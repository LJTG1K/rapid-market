import Link from 'next/link';
import { useEffect, useState } from 'react';
import { diffDraft, draftLabel, targetHref } from '../lib/targets';
import { api, timeAgo } from '../lib/client';
import type { Draft } from '../lib/types';
import { DiffList } from './DiffList';
import { useStudio } from './StudioContext';
import { Badge, Button, Modal, OP_LABEL, Spinner } from './ui';

interface Preview {
  drafts: Draft[];
  errors: string[];
  warnings: string[];
  newTags: string[];
  changeCount: number;
}

export function PendingTray() {
  const { drafts, refreshDrafts, trayOpen, setTrayOpen, status, refreshStatus, showToast, bumpContent } = useStudio();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [checking, setChecking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ summary: string; commitUrl: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const draftKey = drafts.map((d) => d.id + d.updatedAt).join();
  useEffect(() => {
    if (!trayOpen) return;
    setError(null);
    if (!drafts.length) {
      setPreview(null);
      return;
    }
    setChecking(true);
    api<Preview>('/api/publish')
      .then(setPreview)
      .catch((e) => setError(e.message))
      .finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trayOpen, draftKey]);

  useEffect(() => {
    if (!trayOpen) setResult(null);
  }, [trayOpen]);

  async function discard(d: Draft) {
    await api(`/api/drafts?targetType=${d.targetType}&targetKey=${encodeURIComponent(d.targetKey)}`, { method: 'DELETE' });
    await refreshDrafts();
    showToast(`Discarded changes to ${draftLabel(d)}`);
  }

  async function doPublish() {
    setConfirming(false);
    setPublishing(true);
    setError(null);
    try {
      const r = await api<{ summary: string; commitUrl: string | null }>('/api/publish', { method: 'POST' });
      setResult(r);
      bumpContent();
      await Promise.all([refreshDrafts(), refreshStatus()]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPublishing(false);
    }
  }

  const blocked = !!preview?.errors.length || checking || !drafts.length;
  const isLocal = status?.contentMode === 'local';

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-zinc-900/10 transition-opacity ${trayOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setTrayOpen(false)}
      />
      <aside
        className={`fixed right-0 top-0 z-40 flex h-full w-[460px] flex-col border-l border-zinc-200 bg-white shadow-2xl transition-transform duration-200 ${trayOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!trayOpen}
      >
        <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold">Pending changes</h2>
            <p className="text-xs text-zinc-500">Nothing goes live until someone publishes. Everyone sees the same queue.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setTrayOpen(false)} aria-label="Close">
            ✕
          </Button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto bg-zinc-50/60 px-5 py-4">
          {result && (
            <div className="rounded-lg border border-accent/20 bg-accent-soft p-4 text-sm text-accent">
              <div className="font-semibold">Published</div>
              <div className="mt-0.5 text-[13px]">{result.summary}</div>
              <div className="mt-2 text-xs text-accent/80">
                {result.commitUrl ? (
                  <>
                    Committed.{' '}
                    <a className="underline" href={result.commitUrl} target="_blank" rel="noreferrer">
                      View commit
                    </a>
                    . The site redeploys in about 1–2 minutes.
                  </>
                ) : (
                  'Written to your local working copy (dev mode). Nothing was committed.'
                )}
              </div>
            </div>
          )}

          {!drafts.length && !result && (
            <div className="py-16 text-center text-sm text-zinc-500">
              No pending changes.
              <div className="mt-1 text-xs text-zinc-400">Edits you save show up here for review.</div>
            </div>
          )}

          {drafts.map((d) => (
            <div key={d.id} className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge tone={d.op}>{OP_LABEL[d.op]}</Badge>
                    <Link href={targetHref(d.targetType, d.targetKey)} onClick={() => setTrayOpen(false)} className="truncate font-medium text-zinc-900 hover:underline">
                      {draftLabel(d)}
                    </Link>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {d.editorName} · {timeAgo(d.updatedAt)}
                    {d.overwroteEditor && <span className="text-amber-700"> · overwrote {d.overwroteEditor}&apos;s edit</span>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => discard(d)}>
                  Discard
                </Button>
              </div>
              <div className="mt-3 border-t border-zinc-100 pt-3">
                <DiffList diffs={diffDraft(d)} />
              </div>
            </div>
          ))}
        </div>

        <footer className="space-y-3 border-t border-zinc-200 px-5 py-4">
          {checking && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Spinner /> Checking changes…
            </div>
          )}
          {error && <Notice tone="error" items={error.split('\n')} />}
          {preview?.errors.length ? <Notice tone="error" title="Fix before publishing" items={preview.errors} /> : null}
          {preview?.warnings.length ? <Notice tone="warn" items={preview.warnings} /> : null}
          {preview?.newTags.length ? (
            <Notice tone="info" title="New tags" items={[`These tags don't exist yet: ${preview.newTags.join(', ')}. Check for typos, since tags feed the style quiz.`]} />
          ) : null}
          <Button variant="publish" className="w-full" disabled={blocked || publishing} onClick={() => setConfirming(true)}>
            {publishing ? (
              <>
                <Spinner /> Publishing…
              </>
            ) : (
              `Publish ${drafts.length || ''} ${drafts.length === 1 ? 'change' : 'changes'}`
            )}
          </Button>
          {isLocal && <p className="text-center text-[11px] text-zinc-400">Dev mode: publishing writes to your local files instead of GitHub.</p>}
        </footer>
      </aside>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Publish ${drafts.length} ${drafts.length === 1 ? 'change' : 'changes'}?`}
        footer={
          <>
            <Button onClick={() => setConfirming(false)}>Cancel</Button>
            <Button variant="publish" onClick={doPublish}>
              Publish
            </Button>
          </>
        }
      >
        This publishes everyone&apos;s pending changes, not just yours. The live site updates after the redeploy (about 1–2 minutes). You can revert it from History.
      </Modal>
    </>
  );
}

function Notice({ tone, title, items }: { tone: 'error' | 'warn' | 'info'; title?: string; items: string[] }) {
  const cls = {
    error: 'border-red-200 bg-red-50 text-red-800',
    warn: 'border-amber-200 bg-amber-50 text-amber-900',
    info: 'border-accent/20 bg-accent-soft text-accent',
  }[tone];
  return (
    <div className={`rounded-md border px-3 py-2 text-xs ${cls}`}>
      {title && <div className="mb-1 font-semibold">{title}</div>}
      <ul className="space-y-0.5">
        {items.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </div>
  );
}
