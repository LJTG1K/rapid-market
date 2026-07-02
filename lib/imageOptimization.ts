/**
 * Image Optimization Utilities
 * Helps serve optimized images for better performance and SEO
 */

interface ImageSize {
  width: number;
  height: number;
}

type SizeKey = 'thumbnail' | 'card' | 'detail' | 'hero';

const COMMON_SIZES: Record<SizeKey, ImageSize> = {
  thumbnail: { width: 150, height: 150 },
  card: { width: 300, height: 300 },
  detail: { width: 600, height: 600 },
  hero: { width: 1200, height: 600 },
};

/**
 * Generate srcSet for responsive images
 * Provides multiple image sizes for different devices
 */
export function generateSrcSet(
  imageUrl: string,
  _sizes: SizeKey = 'card'
): string {
  // Return original URL if it's already optimized or external
  // Future: can extend this to generate actual srcset with multiple sizes
  if (imageUrl.includes('/_next/image')) {
    return imageUrl;
  }

  return imageUrl;
}

/**
 * Get image dimensions for better layout shifts
 * Use in Image component's width/height props
 */
export function getImageDimensions(
  type: SizeKey = 'card'
): ImageSize {
  return COMMON_SIZES[type];
}

/**
 * Placeholder for low-quality image loading (LQIP)
 * Returns a base64 encoded placeholder
 */
export const PLACEHOLDER_BLUR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg==';

/**
 * Optimized image loader for Next.js Image component
 * Custom loader if using external image service
 */
export const imageLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
  // For local images, just return as-is
  // For external images, add optimization params if using a CDN
  return `${src}`;
};

/**
 * Get alt text that's SEO-friendly
 * Fallback if specific alt text isn't provided
 */
export function generateAltText(productName: string, type: string = 'product'): string {
  return `${productName} - ${type} image`;
}
