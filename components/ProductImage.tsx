import { useState } from 'react';
import { cdnResize, VARIANT_WIDTH, type ImageVariant } from '@/lib/cdnImage';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  /** Which rendition to request from the seller's CDN. Defaults to 'card'. */
  variant?: ImageVariant;
  /** Above-the-fold / LCP images: eager + high fetch priority instead of lazy. */
  priority?: boolean;
  className?: string;
  /** Label for the hatch placeholder when there is no usable image. */
  placeholderLabel?: string;
  /**
   * Omit the width/height attributes, for `h-auto object-contain` layouts where
   * the element's height comes from the image's real aspect ratio. Without this,
   * the square intrinsic size we declare would dictate the wrong height.
   */
  naturalAspect?: boolean;
}

/** 0 = CDN-resized · 1 = original URL · 2 = out of options, show the hatch. */
type Stage = 0 | 1 | 2;

/**
 * Single place where remote product photographs are rendered.
 *
 * Replaces 15 copy-pasted <img> tags, and exists mainly so three things are
 * decided once: the CDN rendition to request (see lib/cdnImage), lazy-loading,
 * and what happens when an image is missing or broken.
 *
 * The fallback ladder is what makes the CDN rewrite safe to ship: a resized URL
 * that fails falls back to the untouched original (i.e. today's behaviour), and
 * only a genuinely dead source reaches the placeholder. No request ever leaves
 * for a third-party placeholder service.
 */
export default function ProductImage({
  src,
  alt,
  variant = 'card',
  priority = false,
  className = 'w-full h-full object-cover',
  placeholderLabel,
  naturalAspect = false,
}: ProductImageProps) {
  // Tracked alongside the src it belongs to, so a recycled component instance
  // showing a different product doesn't inherit the previous one's failures.
  const [state, setState] = useState<{ src: string | null | undefined; stage: Stage }>({ src, stage: 0 });
  const stage = state.src === src ? state.stage : 0;
  if (state.src !== src) setState({ src, stage: 0 });

  if (!src || stage === 2) {
    return (
      <div className="w-full h-full placeholder-media flex items-center justify-center font-mono text-[10px] uppercase tracking-wide text-muted text-center px-3">
        [ {placeholderLabel || alt || 'Image unavailable'} ]
      </div>
    );
  }

  const width = VARIANT_WIDTH[variant];
  const resized = stage === 0;

  return (
    <img
      src={resized ? cdnResize(src, width) : src}
      // Fixed CDN renditions, so 1x/2x descriptors rather than `sizes` + `w`:
      // each call site already pins its width band via its grid.
      srcSet={resized ? `${cdnResize(src, width)} 1x, ${cdnResize(src, width * 2)} 2x` : undefined}
      alt={alt}
      width={naturalAspect ? undefined : width}
      height={naturalAspect ? undefined : width}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      // React 18 doesn't recognise camelCase fetchPriority and warns; the
      // lowercase DOM attribute passes through cleanly. Revisit on React 19.
      {...(priority ? ({ fetchpriority: 'high' } as Record<string, string>) : {})}
      onError={() => setState({ src, stage: resized ? 1 : 2 })}
      className={className}
    />
  );
}
