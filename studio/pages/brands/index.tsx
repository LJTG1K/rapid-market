import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { Layout } from '../../components/Layout';
import { useBrands } from '../../components/useBrands';
import { Badge, Button, Input, OP_LABEL, Spinner, cx } from '../../components/ui';

type Filter = 'all' | 'pending' | 'no-products';

export default function BrandsPage() {
  const router = useRouter();
  const { brands, drafts, matchesFor, productsReady, productsAvailable, error } = useBrands();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const draftBySlug = useMemo(() => new Map(drafts.map((d) => [d.targetKey, d])), [drafts]);
  // Brands being deleted vanish from the working copy; keep them listed, struck through.
  const deleting = drafts.filter((d) => d.op === 'delete' && d.base).map((d) => d.base!);

  const rows = useMemo(() => {
    if (!brands) return [];
    const q = query.trim().toLowerCase();
    return [...brands, ...deleting]
      .sort((a, b) => a.brandName.localeCompare(b.brandName, undefined, { sensitivity: 'base' }))
      .filter((b) => !q || b.brandName.toLowerCase().includes(q) || b.slug.includes(q) || b.aesthetic.some((t) => t.includes(q)) || b.description.toLowerCase().includes(q))
      .filter((b) => (filter === 'pending' ? draftBySlug.has(b.slug) : filter === 'no-products' ? productsAvailable && matchesFor(b.brandName).length === 0 : true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brands, drafts, query, filter, matchesFor, productsAvailable]);

  const noProductCount = useMemo(() => (brands && productsAvailable ? brands.filter((b) => matchesFor(b.brandName).length === 0).length : 0), [brands, matchesFor, productsAvailable]);

  return (
    <Layout
      title="Brands"
      actions={
        <Button variant="primary" onClick={() => router.push('/brands/new')}>
          + New brand
        </Button>
      }
    >
      <div className="mb-4 flex items-center gap-3">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, slug, tag or description…" className="max-w-sm" autoFocus />
        <div className="flex rounded-md border border-zinc-200 bg-white p-0.5 text-[13px]">
          {(
            [
              ['all', `All${brands ? ` · ${brands.length}` : ''}`],
              ['pending', `Pending · ${drafts.length}`],
              ['no-products', `No products${productsAvailable ? ` · ${noProductCount}` : ''}`],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} className={cx('rounded px-2.5 py-1', filter === key ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-900')}>
              {label}
            </button>
          ))}
        </div>
        {productsReady && !productsAvailable && <span className="text-xs text-amber-700">Product feed unavailable, so match counts are hidden.</span>}
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">Couldn&apos;t load brands: {error}</div>}
      {!brands && !error && (
        <div className="flex items-center gap-2 py-20 text-sm text-zinc-500">
          <Spinner /> Loading brands…
        </div>
      )}

      {brands && (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-2 font-medium">Brand</th>
                <th className="px-4 py-2 font-medium">Description</th>
                <th className="px-4 py-2 font-medium">Tags</th>
                <th className="w-24 px-4 py-2 text-right font-medium">Products</th>
                <th className="w-40 px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((b) => {
                const d = draftBySlug.get(b.slug);
                const count = matchesFor(b.brandName).length;
                return (
                  <tr key={b.slug} onClick={() => router.push(`/brands/${b.slug}`)} className={cx('cursor-pointer hover:bg-zinc-50', d?.op === 'delete' && 'opacity-50')}>
                    <td className="px-4 py-2.5 align-top">
                      <Link href={`/brands/${b.slug}`} className={cx('font-medium text-zinc-900', d?.op === 'delete' && 'line-through')} onClick={(e) => e.stopPropagation()}>
                        {b.brandName}
                      </Link>
                      <div className="text-xs text-zinc-400">/{b.slug}</div>
                    </td>
                    <td className="max-w-[360px] px-4 py-2.5 align-top text-zinc-600">
                      <div className="line-clamp-2">{b.description}</div>
                    </td>
                    <td className="px-4 py-2.5 align-top">
                      <div className="flex max-w-[260px] flex-wrap gap-1">
                        {b.aesthetic.slice(0, 3).map((t) => (
                          <span key={t} className="rounded bg-accent-soft px-1.5 py-0.5 text-[11px] text-accent">
                            {t}
                          </span>
                        ))}
                        {b.aesthetic.length > 3 && <span className="px-1 text-[11px] text-zinc-400">+{b.aesthetic.length - 3}</span>}
                      </div>
                    </td>
                    <td className={cx('px-4 py-2.5 text-right align-top tabular-nums', count === 0 ? 'text-amber-700' : 'text-zinc-700')}>
                      {productsAvailable ? count : '—'}
                    </td>
                    <td className="px-4 py-2.5 align-top">
                      {d ? (
                        <div className="flex items-center gap-1.5">
                          <Badge tone={d.op}>{OP_LABEL[d.op]}</Badge>
                          <span className="truncate text-xs text-zinc-500">{d.editorName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400">Live</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-zinc-500">
                    No brands match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
