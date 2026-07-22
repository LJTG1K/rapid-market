import { useCountUp } from '@/hooks/useCountUp';

interface CountUpProps {
  value: string;
  className?: string;
  duration?: number;
}

/** Counts a stat up from 0 to its final value when scrolled into view.
 *  Falls back to rendering the raw string statically if it isn't numeric. */
export default function CountUp({ value, className = '', duration }: CountUpProps) {
  const { ref, parsed } = useCountUp<HTMLSpanElement>(value, { duration });

  if (!parsed) return <span className={className}>{value}</span>;

  return (
    <span ref={ref} className={`${className} tabular-nums`}>
      {value}
    </span>
  );
}
