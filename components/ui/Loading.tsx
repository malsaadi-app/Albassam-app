/**
 * Loading Components
 * 
 * Consistent loading states across the application:
 * - Spinner (default)
 * - Skeleton loaders
 * - Progress bars
 * - Page loaders
 * - Button loaders
 */

'use client';

import { CSSProperties } from 'react';

/**
 * Spinner sizes
 */
export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Spinner component
 */
export function Spinner({ 
  size = 'md', 
  color = '#2D1B4E',
  className = '' 
}: { 
  size?: SpinnerSize; 
  color?: string;
  className?: string;
}) {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  };

  const dimension = sizeMap[size];

  return (
    <div className={className} style={{ display: 'inline-block' }}>
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animation: 'spin 1s linear infinite' }}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="60"
          strokeDashoffset="15"
          opacity="0.3"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="60"
          strokeDashoffset="15"
        />
      </svg>
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Loading overlay (full screen)
 */
export function LoadingOverlay({ message = 'جاري التحميل...' }: { message?: string }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 12,
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Spinner size="lg" />
        <p style={{ marginTop: '1rem', color: '#374151', fontSize: '1rem' }}>
          {message}
        </p>
      </div>
    </div>
  );
}

/**
 * Loading page (for full page loads)
 */
export function LoadingPage({ message = 'جاري تحميل الصفحة...' }: { message?: string }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
      }}
    >
      <Spinner size="xl" />
      <p style={{ marginTop: '1.5rem', color: '#6B7280', fontSize: '1.125rem' }}>
        {message}
      </p>
    </div>
  );
}

/**
 * Skeleton loader
 */
export function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className = '',
  style = {},
}: {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#E5E7EB',
        backgroundImage: 'linear-gradient(90deg, #E5E7EB 0%, #F3F4F6 50%, #E5E7EB 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        ...style,
      }}
    >
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
 * Skeleton text (multiple lines)
 */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '70%' : '100%'}
          height="16px"
        />
      ))}
    </div>
  );
}

/**
 * Skeleton card
 */
export function SkeletonCard() {
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: '1.5rem',
        border: '1px solid #E5E7EB',
      }}
    >
      <Skeleton width="60%" height="24px" style={{ marginBottom: '1rem' }} />
      <SkeletonText lines={3} />
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <Skeleton width="80px" height="32px" borderRadius="6px" />
        <Skeleton width="80px" height="32px" borderRadius="6px" />
      </div>
    </div>
  );
}

/**
 * Skeleton table
 */
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '1rem' }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="20px" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '1rem' }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="16px" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Progress bar
 */
export function ProgressBar({
  progress,
  color = '#2D1B4E',
  height = '8px',
  showLabel = false,
}: {
  progress: number;
  color?: string;
  height?: string;
  showLabel?: boolean;
}) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          width: '100%',
          height,
          backgroundColor: '#E5E7EB',
          borderRadius: '999px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clampedProgress}%`,
            height: '100%',
            backgroundColor: color,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      {showLabel && (
        <p style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#6B7280' }}>
          {Math.round(clampedProgress)}%
        </p>
      )}
    </div>
  );
}

/**
 * Button loading state
 */
export function ButtonLoading({ children, loading = false }: { children: React.ReactNode; loading?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      {loading && <Spinner size="sm" color="currentColor" />}
      {children}
    </span>
  );
}

/**
 * Usage Examples:
 * 
 * 1. Spinner:
 * <Spinner size="lg" />
 * 
 * 2. Loading overlay:
 * {loading && <LoadingOverlay message="جاري الحفظ..." />}
 * 
 * 3. Loading page:
 * if (loading) return <LoadingPage />;
 * 
 * 4. Skeleton:
 * <Skeleton width="200px" height="24px" />
 * <SkeletonText lines={3} />
 * <SkeletonCard />
 * <SkeletonTable rows={5} columns={4} />
 * 
 * 5. Progress:
 * <ProgressBar progress={65} showLabel />
 * 
 * 6. Button loading:
 * <button disabled={loading}>
 *   <ButtonLoading loading={loading}>حفظ</ButtonLoading>
 * </button>
 */
