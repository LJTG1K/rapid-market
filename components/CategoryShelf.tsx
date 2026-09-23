import Reveal from './Reveal';
import ProductCard, { type ProductCardData } from './ProductCard';

interface ShelfItem {
  product: ProductCardData;
  tags: string[];
}

interface CategoryShelfProps {
  title: string;
  items: ShelfItem[];
  wishlistCategory: string;
  onSeeAll: () => void;
  /** Image crop passed through to each card — see ProductCard. Defaults to fashion's 4:5. */
  aspect?: '4:5' | 'square';
}

/**
 * One category "rail" on the fashion/tech-listings browse view — a handful of
 * random items from that category plus a link into the full, filterable grid
 * for it. Renders nothing if the category has no items (nothing to shelve).
 */
export default function CategoryShelf({ title, items, wishlistCategory, onSeeAll, aspect }: CategoryShelfProps) {
  if (items.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="flex flex-wrap items-baseline justify-between mb-6 gap-x-4 gap-y-2">
        <h2 className="font-display font-black text-ink text-2xl md:text-3xl tracking-tightest">{title}</h2>
        <button type="button" onClick={onSeeAll} className="btn-secondary !px-5 !py-2.5 text-[11px] whitespace-nowrap">
          See all {title} →
        </button>
      </div>
      <Reveal stagger={60} className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
        {items.map(({ product, tags }) => (
          <ProductCard key={product.id} product={product} wishlistCategory={wishlistCategory} tags={tags} aspect={aspect} />
        ))}
      </Reveal>
    </section>
  );
}
