/**
 * Responsive Image Sizes Configuration
 * 
 * Pre-defined sizes strings for Next.js Image component
 * Follow mobile-first approach
 */

export const IMAGE_SIZES = {
  // Full width on all screens
  FULL: '100vw',

  // Hero images
  HERO: '(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw',

  // Content images
  CONTENT: '(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw',

  // Card images
  CARD: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',

  // Thumbnails
  THUMBNAIL: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',

  // Avatars
  AVATAR_SMALL: '32px',
  AVATAR_MEDIUM: '64px',
  AVATAR_LARGE: '128px',

  // Gallery
  GALLERY: '(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw',

  // Sidebar images
  SIDEBAR: '(max-width: 768px) 100vw, 300px',

  // Logo
  LOGO: '(max-width: 640px) 120px, 200px',

  // Report/Chart images
  CHART: '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw',

  // Mobile-only full width
  MOBILE_FULL: '(max-width: 768px) 100vw, 50vw',

  // Desktop-only full width
  DESKTOP_FULL: '(max-width: 768px) 50vw, 100vw',
} as const;

/**
 * Get responsive sizes for specific use case
 */
export function getImageSizes(type: keyof typeof IMAGE_SIZES): string {
  return IMAGE_SIZES[type];
}

/**
 * Custom sizes builder
 * Build responsive sizes string dynamically
 */
export function buildResponsiveSizes(config: {
  mobile?: string; // < 640px
  tablet?: string; // 640px - 1024px
  desktop?: string; // > 1024px
  fallback?: string;
}): string {
  const { mobile = '100vw', tablet = '50vw', desktop = '33vw', fallback = desktop } = config;

  return `(max-width: 640px) ${mobile}, (max-width: 1024px) ${tablet}, ${fallback}`;
}

/**
 * Example usage:
 * 
 * import { IMAGE_SIZES, getImageSizes } from '@/lib/image-sizes';
 * 
 * <Image
 *   src="/photo.jpg"
 *   alt="Photo"
 *   fill
 *   sizes={IMAGE_SIZES.CARD}
 * />
 * 
 * // Or with helper:
 * <Image
 *   src="/photo.jpg"
 *   alt="Photo"
 *   fill
 *   sizes={getImageSizes('CARD')}
 * />
 * 
 * // Custom sizes:
 * <Image
 *   src="/photo.jpg"
 *   alt="Photo"
 *   fill
 *   sizes={buildResponsiveSizes({
 *     mobile: '100vw',
 *     tablet: '75vw',
 *     desktop: '50vw'
 *   })}
 * />
 */
