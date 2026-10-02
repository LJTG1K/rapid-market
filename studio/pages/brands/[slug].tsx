import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../../components/Layout';
import { useStudio } from '../../components/StudioContext';
import { TagPicker } from '../../components/TagPicker';
import { useBrands } from '../../components/useBrands';
import { Badge, Button, Field, Input, Modal, OP_LABEL, Spinner, Textarea } from '../../components/ui';
import { SLUG_RE, eq, normalizeBrand, slugify } from '../../lib/brands';
import { api, timeAgo } from '../../lib/client';
import type { Brand, Draft } from '../../lib/types';

const EMPTY: Brand = { brandName: '', slug: '', description: '', aesthetic: [], targetCustomer: '', notes: '' };

export default function BrandEditor() {
  const router = useRouter();
  const slugParam = typeof router.query.slug === 'string' ? router.query.slug : '';
  const isNewRoute = slugParam === 'new';
  const { published, brands, drafts, vocabulary, matchesFor, productsAvailable } = useBrands();
  const { refreshDrafts, showToast, setTrayOpen } = useStudio();

  const draft: Draft | undefined = drafts.find((d) => d.targetKey === slugParam);
  const live = published?.find((b) => b.slug === slugParam) ?? null;
  const record = isNewRoute ? EMPTY : draft?.op === 'delete' ? draft.base : brands?.find((b) => b.slug === slugParam) ?? null;
  // Slugs are editable only until the brand's first publish (SPEC.md § Brands).
  const slugEditable = isNewRoute || draft?.op === 'create';

  const [form, setForm] = useState<Brand>(EMPTY);
  const [baseline, setBaseline] = useState<Brand>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | 'rename' | 'delete'>(null);

  const dirty = !eq(normalizeBrand(form), normalizeBrand(baseline));

  // Load the record when the page or its draft changes, but never clobber
  // unsaved typing when the shared queue refreshes in the background.
  const loadKey = `${slugParam}:${draft?.updatedAt ?? ''}:${record ? 1 : 0}`;
  useEffect(() => {
    if (!record || dirty) return;
    setForm(record);
    setBaseline(record);
    setSlugTouched(!isNewRoute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadKey]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = <K extends keyof Brand>(key: K, value: Brand[K]) =>
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'brandName' && slugEditable && !slugTouched) next.slug = slugify(String(value));
      return next;
    });

  const currentMatches = useMemo(() => matchesFor(form.brandName), [form.brandName, matchesFor]);
  const liveMatches = useMemo(() => (live ? matchesFor(live.brandName) : []), [live, matchesFor]);
  const renamed = !!live && form.brandName.trim() !== live.brandName;
  const losesProducts = productsAvailable && renamed && currentMatches.length < liveMatches.length;

  const slugTaken = slugEditable && form.slug !== slugParam && !!brands?.some((b) => b.slug === form.slug);
  const problems = [
    !form.brandName.trim() && 'Brand name is required.',
    !form.description.trim() && 'Description is required.',
    !SLUG_RE.test(form.slug) && 'Slug must be lowercase letters, numbers and hyphens.',
    form.slug === 'new' && 'That slug is reserved.',
    slugTaken && `Slug "${form.slug}" is already used.`,
  ].filter(Boolean) as string[];

  async function save(force = false) {
    if (losesProducts && !force) return setConfirm('rename');
    setConfirm(null);
    setSaving(true);
    setError(null);
    try {
      const isCreate = isNewRoute || draft?.op === 'create';
      const { draft: saved } = await api<{ draft: Draft | null }>('/api/drafts', {
        method: 'PUT',
        body: {
          targetType: 'brand',
          op: isCreate ? 'create' : 'update',
          targetKey: form.slug,
          payload: form,
          previousKey: isCreate && !isNewRoute ? slugParam : undefined,
        },
      });
      await refreshDrafts();
      const normalized = normalizeBrand(form);
      setForm(normalized);
      setBaseline(normalized);
      showToast(saved ? 'Saved to pending changes' : 'Back to the live version, so the draft was removed');
      if (form.slug !== slugParam) router.replace(`/brands/${form.slug}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function markDeleted() {
    setConfirm(null);
    setSaving(true);
    try {
      await api('/api/drafts', { method: 'PUT', body: { targetType: 'brand', op: 'delete', targetKey: slugParam } });
      await refreshDrafts();
      showToast(draft?.op === 'create' ? 'New brand discarded' : 'Deletion added to pending changes');
      router.push('/brands');
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  async function discardDraft() {
    await api(`/api/drafts?targetType=brand&targetKey=${encodeURIComponent(slugParam)}`, { method: 'DELETE' });
    await refreshDrafts();
    showToast('Draft discarded');
    if (draft?.op === 'create') router.push('/brands');
  }

  const loading = !brands;
  const notFound = !loading && !record;
  const title = isNewRoute ? 'New brand' : record?.brandName || 'Brand';

  return (
    <Layout title={title}>
      <div className="mb-5 flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/brands" className="hover:text-zinc-900">
          Brands
        </Link>
        <span>/</span>
        <span className="text-zinc-800">{title}</span>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-20 text-sm text-zinc-500">
          <Spinner /> Loading…
        </div>
      )}
      {notFound && (
        <div className="py-20 text-center text-sm text-zinc-500">
          No brand with slug “{slugParam}”.{' '}
          <Link href="/brands" className="underline">
            Back to brands
          </Link>
        </div>
      )}

      {!loading && record && (
        <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-8">
          <div className="space-y-6">
            {draft && <DraftBanner draft={draft} onDiscard={discardDraft} onReview={() => setTrayOpen(true)} />}

            <fieldset disabled={draft?.op === 'delete'} className="space-y-5 rounded-lg border border-zinc-200 bg-white p-6 disabled:opacity-60">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Brand name" hint="Must match how product titles start in the Sheet, e.g. “BEVAN UP CURVED…” → BEVAN.">
                  <Input value={form.brandName} onChange={(e) => set('brandName', e.target.value)} placeholder="e.g. Gray Dreams" autoFocus={isNewRoute} />
                </Field>
                <Field
                  label="Slug"
                  aside={slugEditable ? 'editable until first publish' : 'locked'}
                  hint={<>rapid.market/brands/<b className="text-zinc-700">{form.slug || '…'}</b></>}
                >
                  <Input
                    value={form.slug}
                    disabled={!slugEditable}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set('slug', e.target.value.toLowerCase());
                    }}
                    title={slugEditable ? undefined : 'Slugs are locked once published so links and SEO never break.'}
                  />
                </Field>
              </div>

              <Field label="Description" aside={`${form.description.length} chars`} hint="Shown on the brand page and brand cards. One or two punchy sentences.">
                <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What the brand makes and what it feels like…" />
              </Field>

              <Field label="Aesthetic tags" hint="Used by the style quiz and wishlist digests. Prefer existing tags. New ones are flagged before publishing.">
                <TagPicker value={form.aesthetic} onChange={(t) => set('aesthetic', t)} vocabulary={vocabulary} />
              </Field>

              <Field label="Target customer">
                <Input value={form.targetCustomer} onChange={(e) => set('targetCustomer', e.target.value)} placeholder="e.g. Minimalist streetwear fans aged 18-30" />
              </Field>

              <Field label="Internal notes" hint="For the team only. Not shown on the site.">
                <Textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
              </Field>
            </fieldset>

            {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}

            <div className="flex items-center justify-between">
              <div>
                {!isNewRoute && draft?.op !== 'delete' && (
                  <Button variant="danger" onClick={() => setConfirm('delete')} disabled={saving}>
                    {draft?.op === 'create' ? 'Discard new brand' : 'Delete brand'}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {dirty && problems.length > 0 && <span className="text-xs text-red-700">{problems[0]}</span>}
                {dirty && !problems.length && <span className="text-xs text-zinc-500">Unsaved changes</span>}
                <Button
                  onClick={() => {
                    setForm(baseline);
                    setError(null);
                  }}
                  disabled={!dirty || saving}
                >
                  Reset
                </Button>
                <Button variant="primary" onClick={() => save()} disabled={!dirty || saving || problems.length > 0}>
                  {saving ? <Spinner /> : 'Save draft'}
                </Button>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-5">
              <div className="flex items-baseline justify-between">
                <h3 className="text-[13px] font-semibold">Product matches</h3>
                {productsAvailable && <span className={`text-2xl font-semibold tabular-nums ${currentMatches.length ? 'text-zinc-900' : 'text-amber-700'}`}>{currentMatches.length}</span>}
              </div>
              {!productsAvailable ? (
                <p className="mt-2 text-xs text-zinc-500">The product feed is unavailable right now.</p>
              ) : (
                <>
                  <p className="mt-1 text-xs text-zinc-500">Products whose title starts with “{form.brandName.trim() || '…'}”. This is exactly what the brand page will list.</p>
                  {renamed && (
                    <p className={`mt-2 rounded px-2 py-1.5 text-xs ${losesProducts ? 'bg-amber-50 text-amber-900' : 'bg-zinc-50 text-zinc-600'}`}>
                      Live name “{live!.brandName}” matches {liveMatches.length}. After this rename: {currentMatches.length}.
                    </p>
                  )}
                  <ul className="mt-3 max-h-72 space-y-1 overflow-auto">
                    {currentMatches.slice(0, 25).map((n, i) => (
                      <li key={i} className="truncate text-xs text-zinc-600" title={n}>
                        {n}
                      </li>
                    ))}
                    {currentMatches.length > 25 && <li className="text-xs text-zinc-400">+{currentMatches.length - 25} more</li>}
                    {!currentMatches.length && form.brandName.trim() && (
                      <li className="text-xs text-amber-700">No products match yet, so the brand page will be empty.</li>
                    )}
                  </ul>
                </>
              )}
            </div>
            {live && (
              <a href={`https://www.rapid.market/brands/${live.slug}`} target="_blank" rel="noreferrer" className="block text-xs text-zinc-500 hover:text-zinc-900">
                View live brand page ↗
              </a>
            )}
          </aside>
        </div>
      )}

      <Modal
        open={confirm === 'rename'}
        onClose={() => setConfirm(null)}
        title="This rename drops products"
        footer={
          <>
            <Button onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => save(true)}>
              Save anyway
            </Button>
          </>
        }
      >
        “{live?.brandName}” currently matches <b>{liveMatches.length}</b> products. “{form.brandName.trim()}” matches <b>{currentMatches.length}</b>. Products are linked by how their title starts, so the
        rest would disappear from this brand page.
      </Modal>

      <Modal
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        title={draft?.op === 'create' ? 'Discard this new brand?' : `Delete ${record?.brandName}?`}
        footer={
          <>
            <Button onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={markDeleted}>
              {draft?.op === 'create' ? 'Discard' : 'Add deletion to pending'}
            </Button>
          </>
        }
      >
        {draft?.op === 'create' ? (
          'It was never published, so this just removes the draft.'
        ) : (
          <>
            Its brand page will go away when the change is published.
            {productsAvailable && (
              <>
                {' '}
                It currently lists <b>{liveMatches.length}</b> products. Those stay in the catalog but lose their brand page.
              </>
            )}
          </>
        )}
      </Modal>
    </Layout>
  );
}

function DraftBanner({ draft, onDiscard, onReview }: { draft: Draft; onDiscard: () => void; onReview: () => void }) {
  const text = {
    create: 'New brand. Not live yet.',
    update: 'Has unpublished edits.',
    delete: 'Marked for deletion.',
  }[draft.op];
  return (
    <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
      <div className="flex items-center gap-2 text-amber-900">
        <Badge tone={draft.op}>{OP_LABEL[draft.op]}</Badge>
        <span>
          {text} Last saved by <b>{draft.editorName}</b> {timeAgo(draft.updatedAt)}
          {draft.overwroteEditor && <> (overwrote {draft.overwroteEditor}&apos;s edit)</>}.
        </span>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={onReview}>
          Review
        </Button>
        <Button size="sm" onClick={onDiscard}>
          {draft.op === 'delete' ? 'Undo delete' : 'Discard'}
        </Button>
      </div>
    </div>
  );
}
