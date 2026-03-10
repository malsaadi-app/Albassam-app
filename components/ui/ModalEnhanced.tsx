'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ModalEnhanced.module.css';
import { HiOutlineX, HiOutlineExclamationCircle, HiOutlineCheckCircle, HiOutlineInformationCircle } from 'react-icons/hi';

// Modal Size
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// Modal Props
interface ModalEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

// Main Modal Component
export function ModalEnhanced({
  isOpen,
  onClose,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true
}: ModalEnhancedProps) {
  // Handle ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = styles[`modal${size.charAt(0).toUpperCase()}${size.slice(1)}`];

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modal = (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={`${styles.modal} ${sizeClass}`}>
        {showCloseButton && (
          <button
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              zIndex: 10
            }}
          >
            <HiOutlineX size={20} />
          </button>
        )}
        {children}
      </div>
    </div>
  );

  // Use portal to render at document body
  if (typeof document !== 'undefined') {
    return createPortal(modal, document.body);
  }

  return null;
}

// Modal Header
interface ModalHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  noBorder?: boolean;
}

export function ModalHeader({ icon, title, subtitle, noBorder = false }: ModalHeaderProps) {
  return (
    <div className={`${styles.modalHeader} ${noBorder ? styles.modalHeaderNoBorder : ''}`}>
      <div className={styles.modalHeaderLeft}>
        {icon && <div className={styles.modalHeaderIcon}>{icon}</div>}
        <div className={styles.modalHeaderContent}>
          <h2 className={styles.modalTitle}>{title}</h2>
          {subtitle && <p className={styles.modalSubtitle}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

// Modal Body
interface ModalBodyProps {
  children: React.ReactNode;
  compact?: boolean;
  loading?: boolean;
}

export function ModalBody({ children, compact = false, loading = false }: ModalBodyProps) {
  if (loading) {
    return (
      <div className={styles.modalLoading}>
        <div className={styles.modalSpinner} />
      </div>
    );
  }

  return (
    <div className={compact ? styles.modalBodyCompact : styles.modalBody}>
      {children}
    </div>
  );
}

// Modal Footer
interface ModalFooterProps {
  children: React.ReactNode;
  noBorder?: boolean;
  spaceBetween?: boolean;
}

export function ModalFooter({ children, noBorder = false, spaceBetween = false }: ModalFooterProps) {
  return (
    <div
      className={`
        ${styles.modalFooter} 
        ${noBorder ? styles.modalFooterNoBorder : ''} 
        ${spaceBetween ? styles.modalFooterSpaceBetween : ''}
      `.trim()}
    >
      {children}
    </div>
  );
}

// Modal Button Helper
interface ModalButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'danger' | 'success';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function ModalButton({
  children,
  onClick,
  variant = 'default',
  disabled = false,
  type = 'button'
}: ModalButtonProps) {
  const variantClass = variant !== 'default' 
    ? styles[`modalButton${variant.charAt(0).toUpperCase()}${variant.slice(1)}`]
    : '';

  return (
    <button
      type={type}
      className={`${styles.modalButton} ${variantClass}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// Confirm Dialog Helper
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'warning' | 'danger' | 'success' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'warning'
}: ConfirmDialogProps) {
  const icons = {
    warning: <HiOutlineExclamationCircle size={32} />,
    danger: <HiOutlineExclamationCircle size={32} />,
    success: <HiOutlineCheckCircle size={32} />,
    info: <HiOutlineInformationCircle size={32} />
  };

  const iconClass = styles[`confirmIcon${variant.charAt(0).toUpperCase()}${variant.slice(1)}`];

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <ModalEnhanced isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader title={title} noBorder />
      <ModalBody>
        <div className={`${styles.confirmIcon} ${iconClass}`}>
          {icons[variant]}
        </div>
        <p className={styles.confirmText}>{message}</p>
      </ModalBody>
      <ModalFooter>
        <ModalButton onClick={onClose}>{cancelText}</ModalButton>
        <ModalButton 
          onClick={handleConfirm} 
          variant={variant === 'danger' ? 'danger' : 'primary'}
        >
          {confirmText}
        </ModalButton>
      </ModalFooter>
    </ModalEnhanced>
  );
}
