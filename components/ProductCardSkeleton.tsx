export default function ProductCardSkeleton({ aspect = 'square' }: { aspect?: 'square' | '4:5' }) {
  return (
    <div className="flex flex-col motion-safe:animate-pulse" aria-hidden="true">
      <div className={`${aspect === '4:5' ? 'aspect-[4/5]' : 'aspect-square'} bg-paper border border-line mb-3`} />
      <div className="h-2.5 w-14 bg-line/60 mb-2" />
      <div className="h-3.5 w-full bg-line/60 mb-1.5" />
      <div className="h-3.5 w-2/3 bg-line/60 mb-3" />
      <div className="mt-auto flex items-center justify-between gap-3">
        <div className="h-3.5 w-8 bg-line/60" />
        <div className="h-7 w-14 bg-line/60" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 9,
  className = '',
  aspect = 'square',
}: {
  count?: number;
  className?: string;
  aspect?: 'square' | '4:5';
}) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} aspect={aspect} />
      ))}
    </div>
  );
}
