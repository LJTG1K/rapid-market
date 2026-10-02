import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { useStudio } from '../components/StudioContext';
import { Badge, Button, Field, Input, Spinner, cx } from '../components/ui';
import { api, timeAgo } from '../lib/client';
import { MAX_PER_VISIT, PICKS_KEY, inPicksRange, validatePicks } from '../lib/picks';
import type { ProductSummary } from '../lib/products';
import type { PicksConfig, PicksDraft } from '../lib/types';

type FormState = { min: string; max: string; perVisit: string };

const toForm = (c: PicksConfig): FormState => ({ min: String(c.min), max: String(c.max), perVisit: String(c.perVisit) });
const fromForm = (f: FormState): PicksConfig => ({ min: Number(f.min), max: Number(f.max), perVisit: Number(f.perVisit) });

function sample<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

export default function PicksPage() {
  const { drafts, refreshDrafts, showToast, setTrayOpen, contentVersion } = useStudio();
  const draft = drafts.find((d): d is PicksDraft => d.targetType === 'picks');
  const [live, setLive] = useState<PicksConfig | null>(null);
  const [products, setProducts] = useState<ProductSummary[] | null>(null);
  const [feedOk, setFeedOk] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [baseline, setBaseline] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seed, setSeed] = useState(0);
  const [showPool, setShowPool] = useState(false);

  useEffect(() => {
    api<{ config: PicksConfig }>('/api/picks').then((r) => setLive(r.config)).catch((e) => setError(e.message));
    api<{ products: ProductSummary[]; available: boolean }>('/api/products')
      .then((r) => {
        // The site's picks page only reads the fashion feed.
        setProducts(r.products.filter((p) => p.category === 'fashion'));
        setFeedOk(r.available);
      })
      .catch(() => setFeedOk(false));
  }, [contentVersion]);

  const current = draft?.payload ?? live;
  const dirty = !!form && !!baseline && JSON.stringify(form) !== JSON.stringify(baseline);
  const loadKey = `${draft?.updatedAt ?? ''}:${live ? JSON.stringify(live) : ''}`;
  useEffect(() => {
    if (!current || dirty) return;
    setForm(toForm(current));
    setBaseline(toForm(current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadKey]);

  const config = form ? fromForm(form) : null;
  const problems = config ? validatePicks(config).map((e) => e.replace("Gilly's Picks: ", '')) : [];

  const stats = useMemo(() => {
    if (!products || !config || problems.length) return null;
    const pool = products.filter((p) => inPicksRange(p.id, config)).sort((a, b) => Number(a.id) - Number(b.id));
    const livePool = live ? products.filter((p) => inPicksRange(p.id, live)) : [];
    const liveIds = new Set(livePool.map((p) => p.id));
    const carried = pool.filter((p) => liveIds.has(p.id)).length;
    const newestId = products.reduce((m, p) => (Number.isInteger(Number(p.id)) ? Math.max(m, Number(p.id)) : m), 0);
    return { pool, livePoolSize: livePool.length, carried, fresh: pool.length - carried, newestId, span: config.max - config.min + 1 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, form, live, problems.length]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const visit = useMemo(() => (stats && config ? sample(stats.pool, config.perVisit) : []), [stats, seed, form?.perVisit]);

  function setField(k: keyof FormState, v: string) {
    setForm((f) => (f ? { ...f, [k]: v.replace(/[^0-9]/g, '') } : f));
  }

  function moveToNewest() {
    if (!stats || !config) return;
    const width = config.max - config.min;
    setForm((f) => (f ? { ...f, min: String(Math.max(1, stats.newestId - width)), max: String(stats.newestId) } : f));
  }

  async function save() {
    if (!config) return;
    setSaving(true);
    setError(null);
    try {
      const { draft: saved } = await api<{ draft: PicksDraft | null }>('/api/drafts', { method: 'PUT', body: { targetType: 'picks', targetKey: PICKS_KEY, payload: config } });
      await refreshDrafts();
      setBaseline(form);
      showToast(saved ? 'Saved to pending changes' : 'Back to the live settings, so the draft was removed');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function discard() {
    await api(`/api/drafts?targetType=picks&targetKey=${PICKS_KEY}`, { method: 'DELETE' });
    await refreshDrafts();
    if (live) {
      setForm(toForm(live));
      setBaseline(toForm(live));
    }
    showToast('Draft discarded');
  }

  const loading = !form || !live;

  return (
    <Layout title="Gilly's Picks">
      {loading && !error && (
        <div className="flex items-center gap-2 py-20 text-sm text-zinc-500">
          <Spinner /> Loading…
        </div>
      )}
      {error && !form && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">Couldn&apos;t load picks: {error}</div>}

      {!loading && form && live && (
        <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-8">
          <div className="space-y-6">
            <p className="max-w-2xl text-sm text-zinc-500">
              The page picks from every fashion product whose ID (column A of the Sheet) is in this range, and shows a random handful on each visit.
            </p>

            {draft && (
              <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <div className="flex items-center gap-2">
                  <Badge tone="update">Edited</Badge>
                  <span>
                    Unpublished changes. Last saved by <b>{draft.editorName}</b> {timeAgo(draft.updatedAt)}
                    {draft.overwroteEditor && <> (overwrote {draft.overwroteEditor}&apos;s edit)</>}.
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setTrayOpen(true)}>
                    Review
                  </Button>
                  <Button size="sm" onClick={discard}>
                    Discard
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-5 rounded-lg border border-zinc-200 bg-white p-6">
              <div className="grid grid-cols-3 gap-4">
                <Field label="First product ID" aside={`live ${live.min}`}>
                  <Input inputMode="numeric" value={form.min} onChange={(e) => setField('min', e.target.value)} />
                </Field>
                <Field label="Last product ID" aside={`live ${live.max}`}>
                  <Input inputMode="numeric" value={form.max} onChange={(e) => setField('max', e.target.value)} />
                </Field>
                <Field label="Products per visit" aside={`live ${live.perVisit}`}>
                  <Input inputMode="numeric" value={form.perVisit} onChange={(e) => setField('perVisit', e.target.value)} />
                </Field>
              </div>

              {stats && stats.newestId > 0 && (
                <div className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2.5 text-xs text-zinc-600">
                  <span>
                    Newest product in the Sheet is <b className="text-zinc-900">#{stats.newestId}</b>.
                    {config && config.max >= stats.newestId ? ' This range already reaches it.' : ` This range stops ${stats.newestId - (config?.max ?? 0)} IDs short.`}
                  </span>
                  <Button size="sm" onClick={moveToNewest} disabled={!!config && config.max === stats.newestId}>
                    Move range to newest (keep {stats.span} IDs)
                  </Button>
                </div>
              )}

              {problems.length > 0 && <div className="text-xs text-red-700">{problems[0]}</div>}
              {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}

              <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-4">
                {dirty && !problems.length && <span className="text-xs text-zinc-500">Unsaved changes</span>}
                <Button onClick={() => baseline && setForm(baseline)} disabled={!dirty || saving}>
                  Reset
                </Button>
                <Button variant="primary" onClick={save} disabled={!dirty || saving || problems.length > 0}>
                  {saving ? <Spinner /> : 'Save draft'}
                </Button>
              </div>
            </div>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-[13px] font-semibold">Preview a visit</h2>
                  <p className="text-xs text-zinc-500">A random {config?.perVisit ?? ''} from the pool, the same way the live page picks them.</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setShowPool((s) => !s)} disabled={!stats}>
                    {showPool ? 'Hide full pool' : `Show full pool (${stats?.pool.length ?? 0})`}
                  </Button>
                  <Button size="sm" onClick={() => setSeed((s) => s + 1)} disabled={!stats?.pool.length}>
                    Shuffle
                  </Button>
                </div>
              </div>
              {!products && feedOk && (
                <div className="flex items-center gap-2 py-10 text-sm text-zinc-500">
                  <Spinner /> Loading products…
                </div>
              )}
              {!feedOk && <div className="text-sm text-amber-700">The product feed is unavailable, so there&apos;s no preview right now.</div>}
              {stats && !stats.pool.length && <div className="rounded-md border border-dashed border-zinc-300 py-10 text-center text-sm text-zinc-500">No fashion products in this range.</div>}
              <ProductGrid products={showPool ? stats?.pool ?? [] : visit} compact={showPool} />
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-5">
              <div className="flex items-baseline justify-between">
                <h3 className="text-[13px] font-semibold">Pool size</h3>
                {stats && (
                  <span className={cx('text-2xl font-semibold tabular-nums', config && stats.pool.length < config.perVisit ? 'text-amber-700' : 'text-zinc-900')}>{stats.pool.length}</span>
                )}
              </div>
              {stats ? (
                <dl className="mt-3 space-y-1.5 text-xs">
                  <Row label="IDs in range" value={stats.span} />
                  <Row label="Missing or non-fashion IDs" value={stats.span - stats.pool.length} />
                  <Row label="Carried over from live" value={stats.carried} />
                  <Row label="New vs live" value={stats.fresh} accent />
                  <Row label="Live pool" value={stats.livePoolSize} />
                </dl>
              ) : (
                <p className="mt-2 text-xs text-zinc-500">{problems.length ? 'Fix the range to see stats.' : 'Waiting for the product feed…'}</p>
              )}
              {stats && config && stats.pool.length > 0 && stats.pool.length < config.perVisit && (
                <p className="mt-3 rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
                  Only {stats.pool.length} products in the pool, so visitors see {stats.pool.length} picks, not {config.perVisit}.
                </p>
              )}
              {stats && config && stats.pool.length >= config.perVisit && (
                <p className="mt-3 text-xs text-zinc-500">
                  Each visit shows {config.perVisit} of {stats.pool.length} (about {Math.round((config.perVisit / stats.pool.length) * 100)}% of the pool).
                </p>
              )}
            </div>
            <p className="px-1 text-xs text-zinc-400">Per visit is capped at {MAX_PER_VISIT}.</p>
            <a href="https://www.rapid.market/gillys-picks" target="_blank" rel="noreferrer" className="block px-1 text-xs text-zinc-500 hover:text-zinc-900">
              View live page ↗
            </a>
          </aside>
        </div>
      )}
    </Layout>
  );
}

function Row({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-zinc-500">{label}</dt>
      <dd className={cx('tabular-nums', accent ? 'font-medium text-accent' : 'text-zinc-800')}>{value}</dd>
    </div>
  );
}

function ProductGrid({ products, compact }: { products: ProductSummary[]; compact?: boolean }) {
  if (!products.length) return null;
  return (
    <ul className={cx('grid gap-3', compact ? 'grid-cols-6' : 'grid-cols-5')}>
      {products.map((p) => (
        <li key={p.id} className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="aspect-square bg-zinc-100">
            {p.image && <img src={p.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />}
          </div>
          <div className="p-2">
            <div className="line-clamp-2 text-[11px] leading-snug text-zinc-800" title={p.name}>
              {p.name}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-zinc-400">
              <span>#{p.id}</span>
              <span>{p.price}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
