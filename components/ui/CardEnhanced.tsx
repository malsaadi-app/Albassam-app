'use client';

import React from 'react';
import styles from './CardEnhanced.module.css';

// Card Variants
export type CardVariant = 
  | 'default' 
  | 'outlined' 
  | 'elevated' 
  | 'gradient' 
  | 'stats' 
  | 'success' 
  | 'warning' 
  | 'danger';

// Card Props
interface CardEnhancedProps {
  children: React.ReactNode;
  variant?: CardVariant;
  hoverable?: boolean;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

// Main Card Component
export function CardEnhanced({
  children,
  variant = 'default',
  hoverable = false,
  loading = false,
  className = '',
  style,
  onClick
}: CardEnhancedProps) {
  const variantClass = styles[`card${variant.charAt(0).toUpperCase()}${variant.slice(1)}`];
  
  return (
    <div
      className={`
        ${styles.card} 
        ${variantClass} 
        ${hoverable ? styles.cardHoverable : ''} 
        ${loading ? styles.cardLoading : ''} 
        ${className}
      `.trim()}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Card Header
interface CardHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  noBorder?: boolean;
}

export function CardHeader({ icon, title, subtitle, actions, noBorder = false }: CardHeaderProps) {
  return (
    <div className={`${styles.cardHeader} ${noBorder ? styles.cardHeaderNoBorder : ''}`}>
      <div className={styles.cardHeaderLeft}>
        {icon && <div className={styles.cardHeaderIcon}>{icon}</div>}
        <div className={styles.cardHeaderContent}>
          <h3 className={styles.cardHeaderTitle}>{title}</h3>
          {subtitle && <p className={styles.cardHeaderSubtitle}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className={styles.cardHeaderActions}>{actions}</div>}
    </div>
  );
}

// Card Body
interface CardBodyProps {
  children: React.ReactNode;
  compact?: boolean;
}

export function CardBody({ children, compact = false }: CardBodyProps) {
  return (
    <div className={compact ? styles.cardBodyCompact : styles.cardBody}>
      {children}
    </div>
  );
}

// Card Footer
interface CardFooterProps {
  children: React.ReactNode;
  noBorder?: boolean;
}

export function CardFooter({ children, noBorder = false }: CardFooterProps) {
  return (
    <div className={`${styles.cardFooter} ${noBorder ? styles.cardFooterNoBorder : ''}`}>
      {children}
    </div>
  );
}

// Stats Card Helper
interface StatsCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  change?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'gradient' | 'stats' | 'success' | 'warning' | 'danger';
  hoverable?: boolean;
  onClick?: () => void;
}

export function StatsCard({
  icon,
  label,
  value,
  change,
  variant = 'gradient',
  hoverable = false,
  onClick
}: StatsCardProps) {
  return (
    <CardEnhanced variant={variant} hoverable={hoverable} onClick={onClick}>
      <CardBody>
        {icon && <div className={styles.cardHeaderIcon}>{icon}</div>}
        <p className={styles.statsLabel}>{label}</p>
        <div className={styles.statsNumber}>{value}</div>
        {change && (
          <div
            className={`${styles.statsChange} ${
              change.isPositive ? styles.statsChangePositive : styles.statsChangeNegative
            }`}
          >
            {change.isPositive ? '↑' : '↓'} {change.value}
          </div>
        )}
      </CardBody>
    </CardEnhanced>
  );
}

// Header Button Helper
interface HeaderButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
}

export function HeaderButton({ children, onClick, href }: HeaderButtonProps) {
  if (href) {
    return (
      <a href={href} className={styles.headerButton}>
        {children}
      </a>
    );
  }
  
  return (
    <button className={styles.headerButton} onClick={onClick}>
      {children}
    </button>
  );
}
