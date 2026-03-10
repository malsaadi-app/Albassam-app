'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './MobileActionSheet.module.css';

interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function MobileActionSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  actions
}: MobileActionSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    if (!isOpen) return;

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Handle ESC key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Swipe to dismiss
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || !isOpen) return;

    const handleTouchStart = (e: TouchEvent) => {
      startY.current = e.touches[0].clientY;
      currentY.current = startY.current;
    };

    const handleTouchMove = (e: TouchEvent) => {
      currentY.current = e.touches[0].clientY;
      const diff = currentY.current - startY.current;

      if (diff > 0) {
        // Only allow downward swipe
        sheet.style.transform = `translateY(${diff}px)`;
      }
    };

    const handleTouchEnd = () => {
      const diff = currentY.current - startY.current;

      if (diff > 100) {
        // Swipe threshold reached, close sheet
        onClose();
      } else {
        // Reset position
        sheet.style.transform = 'translateY(0)';
      }
    };

    sheet.addEventListener('touchstart', handleTouchStart);
    sheet.addEventListener('touchmove', handleTouchMove);
    sheet.addEventListener('touchend', handleTouchEnd);

    return () => {
      sheet.removeEventListener('touchstart', handleTouchStart);
      sheet.removeEventListener('touchmove', handleTouchMove);
      sheet.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content = (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div ref={sheetRef} className={`${styles.sheet} ${styles.safeArea}`}>
        <div className={styles.handle} />
        
        {(title || subtitle) && (
          <div className={styles.header}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        )}

        <div className={styles.content}>{children}</div>

        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return null;
}

// Action Item Component
interface ActionItemProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  onClick: () => void;
  danger?: boolean;
}

export function ActionItem({
  icon,
  title,
  description,
  onClick,
  danger = false
}: ActionItemProps) {
  return (
    <button
      className={`${styles.actionItem} ${danger ? styles.actionItemDanger : ''}`}
      onClick={onClick}
    >
      {icon && <div className={styles.actionItemIcon}>{icon}</div>}
      <div className={styles.actionItemContent}>
        <div className={styles.actionItemTitle}>{title}</div>
        {description && (
          <div className={styles.actionItemDescription}>{description}</div>
        )}
      </div>
    </button>
  );
}

// Divider Component
export function ActionSheetDivider() {
  return <div className={styles.divider} />;
}
