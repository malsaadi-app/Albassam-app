'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Toast.module.css';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineExclamationCircle, HiOutlineInformationCircle, HiOutlineX } from 'react-icons/hi';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onClose?: () => void;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => string;
  hideToast: (id: string) => void;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
}

export function ToastProvider({ 
  children, 
  position = 'top-right',
  maxToasts = 5
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000
    };

    setToasts((prev) => {
      const updated = [newToast, ...prev];
      return updated.slice(0, maxToasts);
    });

    return id;
  }, [maxToasts]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message: string, title?: string) => {
    return showToast({ type: 'success', message, title });
  }, [showToast]);

  const error = useCallback((message: string, title?: string) => {
    return showToast({ type: 'error', message, title });
  }, [showToast]);

  const warning = useCallback((message: string, title?: string) => {
    return showToast({ type: 'warning', message, title });
  }, [showToast]);

  const info = useCallback((message: string, title?: string) => {
    return showToast({ type: 'info', message, title });
  }, [showToast]);

  const value: ToastContextValue = {
    toasts,
    showToast,
    hideToast,
    success,
    error,
    warning,
    info
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} position={position} onClose={hideToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  position: ToastPosition;
  onClose: (id: string) => void;
}

function ToastContainer({ toasts, position, onClose }: ToastContainerProps) {
  const positionClass = styles[`toastContainer${position.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}`];

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className={`${styles.toastContainer} ${positionClass}`}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>,
    document.body
  );
}

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast.duration) return;

    const startTime = Date.now();
    const endTime = startTime + toast.duration;
    const duration = toast.duration; // Store in const for TypeScript

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const percentage = (remaining / duration) * 100;
      setProgress(percentage);

      if (remaining === 0) {
        clearInterval(interval);
        handleClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
      toast.onClose?.();
    }, 300);
  };

  const icons = {
    success: <HiOutlineCheckCircle size={24} />,
    error: <HiOutlineXCircle size={24} />,
    warning: <HiOutlineExclamationCircle size={24} />,
    info: <HiOutlineInformationCircle size={24} />
  };

  return (
    <div className={`${styles.toast} ${isExiting ? styles.toastExiting : ''} ${styles[`toast${toast.type.charAt(0).toUpperCase()}${toast.type.slice(1)}`]}`}>
      <div className={`${styles.toastIcon} ${styles[`toastIcon${toast.type.charAt(0).toUpperCase()}${toast.type.slice(1)}`]}`}>
        {icons[toast.type]}
      </div>
      
      <div className={styles.toastContent}>
        {toast.title && <div className={styles.toastTitle}>{toast.title}</div>}
        <div className={styles.toastMessage}>{toast.message}</div>
      </div>

      <button className={styles.toastClose} onClick={handleClose} aria-label="Close">
        <HiOutlineX size={18} />
      </button>

      {toast.duration && (
        <div className={styles.toastProgress}>
          <div 
            className={styles.toastProgressBar}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
