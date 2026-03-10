'use client';

import React from 'react';
import styles from './LoadingStates.module.css';

// Spinner Component
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClass = size === 'sm' ? styles.spinnerSm : size === 'lg' ? styles.spinnerLg : '';
  
  return <div className={`${styles.spinner} ${sizeClass} ${className}`} />;
}

// Dots Spinner
export function DotsSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`${styles.dotsSpinner} ${className}`}>
      <div className={styles.dot} />
      <div className={styles.dot} />
      <div className={styles.dot} />
    </div>
  );
}

// Pulse Spinner
export function PulseSpinner({ className = '' }: { className?: string }) {
  return <div className={`${styles.pulseSpinner} ${className}`} />;
}

// Bars Spinner
export function BarsSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`${styles.barsSpinner} ${className}`}>
      <div className={styles.bar} />
      <div className={styles.bar} />
      <div className={styles.bar} />
      <div className={styles.bar} />
    </div>
  );
}

// Full Page Loading
interface FullPageLoadingProps {
  text?: string;
  spinnerType?: 'spinner' | 'dots' | 'pulse' | 'bars';
}

export function FullPageLoading({ 
  text = 'جاري التحميل...',
  spinnerType = 'spinner'
}: FullPageLoadingProps) {
  const spinners = {
    spinner: <Spinner size="lg" />,
    dots: <DotsSpinner />,
    pulse: <PulseSpinner />,
    bars: <BarsSpinner />
  };

  return (
    <div className={styles.fullPageLoading}>
      {spinners[spinnerType]}
      {text && <div className={styles.loadingText}>{text}</div>}
    </div>
  );
}

// Loading Overlay
interface LoadingOverlayProps {
  show: boolean;
  text?: string;
}

export function LoadingOverlay({ show, text }: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.spinnerContainer}>
        <Spinner />
        {text && <div className={styles.spinnerLabel}>{text}</div>}
      </div>
    </div>
  );
}

// Skeleton Components
export function SkeletonText({ width = '100%', className = '' }: { width?: string; className?: string }) {
  return (
    <div 
      className={`${styles.skeleton} ${styles.skeletonText} ${className}`}
      style={{ width }}
    />
  );
}

export function SkeletonTitle({ width = '60%', className = '' }: { width?: string; className?: string }) {
  return (
    <div 
      className={`${styles.skeleton} ${styles.skeletonTitle} ${className}`}
      style={{ width }}
    />
  );
}

export function SkeletonCircle({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <div 
      className={`${styles.skeleton} ${styles.skeletonCircle} ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}

export function SkeletonButton({ width = '120px', className = '' }: { width?: string; className?: string }) {
  return (
    <div 
      className={`${styles.skeleton} ${styles.skeletonButton} ${className}`}
      style={{ width }}
    />
  );
}

// Skeleton Card
export function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonCardHeader}>
        <SkeletonCircle size={48} />
        <div style={{ flex: 1 }}>
          <SkeletonTitle width="70%" />
          <SkeletonText width="40%" />
        </div>
      </div>
      <div className={styles.skeletonCardBody}>
        <SkeletonText width="100%" />
        <SkeletonText width="90%" />
        <SkeletonText width="80%" />
      </div>
    </div>
  );
}

// Skeleton Table
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div className={styles.skeletonTable}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className={styles.skeletonTableRow}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={colIndex}
              className={`${styles.skeleton} ${styles.skeletonTableCell}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Progress Bar
interface ProgressBarProps {
  value?: number; // 0-100, undefined for indeterminate
  className?: string;
}

export function ProgressBar({ value, className = '' }: ProgressBarProps) {
  return (
    <div className={`${styles.progressBar} ${className}`}>
      {value !== undefined ? (
        <div 
          className={styles.progressFill}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      ) : (
        <div className={styles.progressIndeterminate} />
      )}
    </div>
  );
}

// Spinner Container (with label)
interface SpinnerContainerProps {
  label?: string;
  spinnerType?: 'spinner' | 'dots' | 'pulse' | 'bars';
  className?: string;
}

export function SpinnerContainer({ 
  label, 
  spinnerType = 'spinner',
  className = ''
}: SpinnerContainerProps) {
  const spinners = {
    spinner: <Spinner />,
    dots: <DotsSpinner />,
    pulse: <PulseSpinner />,
    bars: <BarsSpinner />
  };

  return (
    <div className={`${styles.spinnerContainer} ${className}`}>
      {spinners[spinnerType]}
      {label && <div className={styles.spinnerLabel}>{label}</div>}
    </div>
  );
}
