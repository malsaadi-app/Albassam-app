'use client';

import React from 'react';
import styles from '@/styles/responsive.module.css';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}

export function ResponsiveContainer({
  children,
  size = 'xl',
  className = ''
}: ResponsiveContainerProps) {
  const sizeClass = size === 'full' ? '' : styles[`container${size.charAt(0).toUpperCase()}${size.slice(1)}`];

  return (
    <div className={`${styles.container} ${sizeClass} ${className}`}>
      {children}
    </div>
  );
}

// Responsive Grid
interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ResponsiveGrid({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className = ''
}: ResponsiveGridProps) {
  const gapSizes = {
    sm: '12px',
    md: '16px',
    lg: '24px'
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gap: gapSizes[gap],
    gridTemplateColumns: `repeat(${columns.mobile || 1}, 1fr)`,
  };

  return (
    <div className={className} style={gridStyle}>
      <style jsx>{`
        @media (min-width: 768px) {
          div {
            grid-template-columns: repeat(${columns.tablet || 2}, 1fr);
          }
        }
        @media (min-width: 1024px) {
          div {
            grid-template-columns: repeat(${columns.desktop || 3}, 1fr);
          }
        }
      `}</style>
      {children}
    </div>
  );
}

// Responsive Stack
interface ResponsiveStackProps {
  children: React.ReactNode;
  direction?: 'vertical' | 'horizontal' | 'responsive';
  gap?: 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  className?: string;
}

export function ResponsiveStack({
  children,
  direction = 'responsive',
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  className = ''
}: ResponsiveStackProps) {
  const gapSizes = {
    sm: '12px',
    md: '16px',
    lg: '24px'
  };

  const alignMap = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch'
  };

  const justifyMap = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around'
  };

  const stackStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction === 'vertical' ? 'column' : 'row',
    gap: gapSizes[gap],
    alignItems: alignMap[align],
    justifyContent: justifyMap[justify]
  };

  if (direction === 'responsive') {
    return (
      <div className={className}>
        <style jsx>{`
          div {
            display: flex;
            flex-direction: column;
            gap: ${gapSizes[gap]};
            align-items: ${alignMap[align]};
            justify-content: ${justifyMap[justify]};
          }
          @media (min-width: 768px) {
            div {
              flex-direction: row;
            }
          }
        `}</style>
        {children}
      </div>
    );
  }

  return (
    <div className={className} style={stackStyle}>
      {children}
    </div>
  );
}

// Hide/Show Components
interface HideShowProps {
  children: React.ReactNode;
  hideOn?: 'mobile' | 'tablet' | 'desktop';
  showOn?: 'mobile' | 'tablet' | 'desktop';
}

export function HideShow({ children, hideOn, showOn }: HideShowProps) {
  let className = '';

  if (hideOn === 'mobile') className = styles.hideMobile;
  else if (hideOn === 'tablet') className = styles.hideTablet;
  else if (hideOn === 'desktop') className = styles.hideDesktop;
  else if (showOn === 'mobile') className = styles.showMobile;
  else if (showOn === 'tablet') className = styles.showTablet;
  else if (showOn === 'desktop') className = styles.showDesktop;

  return <div className={className}>{children}</div>;
}

// Touch Button Wrapper
interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function TouchButton({
  children,
  onClick,
  disabled = false,
  className = ''
}: TouchButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${styles.touchButton} ${styles.touchFeedback} ${className}`}
      style={{
        border: 'none',
        background: 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1
      }}
    >
      {children}
    </button>
  );
}

// Horizontal Scroll Container
interface HorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
}

export function HorizontalScroll({ children, className = '' }: HorizontalScrollProps) {
  return (
    <div className={`${styles.horizontalScroll} ${className}`}>
      {children}
    </div>
  );
}
