// Reusable Skeleton component for loading states
import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
  count?: number;
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  variant = 'text',
  animation = 'pulse',
  className = '',
  count = 1,
}: SkeletonProps) {
  const getVariantClass = () => {
    switch (variant) {
      case 'text':
        return 'rounded';
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return '';
      case 'rounded':
        return 'rounded-lg';
      default:
        return 'rounded';
    }
  };

  const getAnimationClass = () => {
    switch (animation) {
      case 'pulse':
        return 'animate-pulse';
      case 'wave':
        return 'animate-shimmer';
      case 'none':
        return '';
      default:
        return 'animate-pulse';
    }
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  if (count > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`bg-gray-200 dark:bg-gray-700 ${getVariantClass()} ${getAnimationClass()}`}
            style={style}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 ${getVariantClass()} ${getAnimationClass()} ${className}`}
      style={style}
    />
  );
}

// Shimmer wave animation (add to globals.css)
export const shimmerStyles = `
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite linear;
  background: linear-gradient(
    to right,
    #f0f0f0 0%,
    #e0e0e0 20%,
    #f0f0f0 40%,
    #f0f0f0 100%
  );
  background-size: 1000px 100%;
}

.dark .animate-shimmer {
  background: linear-gradient(
    to right,
    #374151 0%,
    #4b5563 20%,
    #374151 40%,
    #374151 100%
  );
  background-size: 1000px 100%;
}
`;

// Pre-built skeleton components for common use cases

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <Skeleton width="60%" height="1.5rem" className="mb-4" />
      <Skeleton count={3} className="mb-2" />
      <div className="mt-4 flex gap-2">
        <Skeleton width="80px" height="2rem" variant="rounded" />
        <Skeleton width="80px" height="2rem" variant="rounded" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="grid gap-4 p-4 border-b border-gray-200 dark:border-gray-700" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="1.5rem" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4 p-4 border-b border-gray-200 dark:border-gray-700" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="1.25rem" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1">
            <Skeleton width="40%" height="1.25rem" className="mb-2" />
            <Skeleton width="60%" height="1rem" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Skeleton width="50%" height="1rem" className="mb-3" />
          <Skeleton width="70%" height="2rem" className="mb-2" />
          <Skeleton width="40%" height="0.875rem" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton width="30%" height="1rem" className="mb-2" />
          <Skeleton width="100%" height="2.5rem" variant="rounded" />
        </div>
      ))}
      <div className="flex gap-3 mt-8">
        <Skeleton width="120px" height="2.5rem" variant="rounded" />
        <Skeleton width="120px" height="2.5rem" variant="rounded" />
      </div>
    </div>
  );
}

export function SkeletonAvatar({ size = 48 }: { size?: number }) {
  return <Skeleton variant="circular" width={size} height={size} />;
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return <Skeleton count={lines} className={className} />;
}
