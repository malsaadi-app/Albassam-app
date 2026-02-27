/**
 * OptimizedImage Component
 * 
 * Wrapper around Next.js Image with best practices:
 * - Automatic WebP/AVIF conversion
 * - Lazy loading by default
 * - Responsive sizes
 * - Error handling with fallback
 * - Loading placeholder (blur or skeleton)
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  fallbackSrc?: string;
  onLoadingComplete?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className = '',
  style = {},
  objectFit = 'cover',
  sizes,
  quality = 85,
  placeholder = 'empty',
  blurDataURL,
  fallbackSrc = '/logo.jpg',
  onLoadingComplete,
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleError = () => {
    console.warn(`Image failed to load: ${imgSrc}`);
    setError(true);
    setImgSrc(fallbackSrc);
  };

  const handleLoadingComplete = () => {
    setLoading(false);
    onLoadingComplete?.();
  };

  // Skeleton loader styles
  const skeletonStyle: React.CSSProperties = {
    backgroundColor: '#e5e7eb',
    backgroundImage: 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    ...style,
  };

  return (
    <div className={`relative ${className}`} style={fill ? { position: 'relative' } : {}}>
      {/* Skeleton loader */}
      {loading && placeholder === 'empty' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            ...skeletonStyle,
          }}
        />
      )}

      {/* Main image */}
      <Image
        src={imgSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={sizes}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        style={{
          objectFit,
          ...style,
          ...(loading ? { opacity: 0 } : { opacity: 1 }),
          transition: 'opacity 0.3s ease-in-out',
        }}
        onError={handleError}
        onLoadingComplete={handleLoadingComplete}
      />

      {/* Error indicator (optional) */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
            color: 'white',
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: '10px',
            fontWeight: 'bold',
          }}
        >
          ⚠️ فشل التحميل
        </div>
      )}

      {/* Shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Usage Examples:
 * 
 * 1. Fixed size:
 * <OptimizedImage
 *   src="/logo.jpg"
 *   alt="Logo"
 *   width={200}
 *   height={100}
 *   priority
 * />
 * 
 * 2. Fill container:
 * <OptimizedImage
 *   src="/banner.jpg"
 *   alt="Banner"
 *   fill
 *   objectFit="cover"
 *   sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
 * />
 * 
 * 3. With blur placeholder:
 * <OptimizedImage
 *   src="/photo.jpg"
 *   alt="Photo"
 *   width={400}
 *   height={300}
 *   placeholder="blur"
 *   blurDataURL="data:image/jpeg;base64,..."
 * />
 * 
 * 4. User upload with fallback:
 * <OptimizedImage
 *   src={employee.photoUrl || '/default-avatar.png'}
 *   alt={employee.fullNameAr}
 *   width={64}
 *   height={64}
 *   className="rounded-full"
 *   fallbackSrc="/default-avatar.png"
 * />
 */
