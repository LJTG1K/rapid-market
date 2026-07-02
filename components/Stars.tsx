interface StarsProps {
  rating?: number;
  className?: string;
  size?: number;
}

export default function Stars({ rating = 5, className = '', size = 16 }: StarsProps) {
  return (
    <div className={`flex gap-0.5 text-stamp ${className}`} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          fill={i < Math.round(rating) ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={i < Math.round(rating) ? 0 : 1.2}
          width={size}
          height={size}
          aria-hidden="true"
        >
          <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2-5.4 3.2 1.3-6-4.6-4.1 6.1-.6z" />
        </svg>
      ))}
    </div>
  );
}
