'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type, duration = 4000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Fade in
    setTimeout(() => setIsVisible(true), 10);

    // Auto close
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      top: '24px',
      right: '24px',
      minWidth: '300px',
      maxWidth: '500px',
      padding: '16px 20px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
      zIndex: 10000,
      fontSize: '14px',
      fontWeight: '600',
      opacity: isVisible && !isExiting ? 1 : 0,
      transform: isVisible && !isExiting ? 'translateY(0)' : 'translateY(-20px)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
    };

    const typeStyles = {
      success: {
        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        color: 'white',
      },
      error: {
        background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
        color: 'white',
      },
      warning: {
        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        color: 'white',
      },
      info: {
        background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
        color: 'white',
      },
    };

    return { ...baseStyles, ...typeStyles[type] };
  };

  const getIcon = () => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };
    return icons[type];
  };

  return (
    <div onClick={handleClose} style={getStyles()}>
      <span style={{ fontSize: '24px', flexShrink: 0 }}>{getIcon()}</span>
      <span style={{ flex: 1, lineHeight: '1.5' }}>{message}</span>
      <span style={{ fontSize: '20px', opacity: 0.8, flexShrink: 0 }}>×</span>
    </div>
  );
}

// Toast Container Hook
export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType }>>([]);
  let nextId = 0;

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map((toast, index) => (
        <div key={toast.id} style={{ position: 'fixed', top: `${24 + index * 80}px`, right: '24px', zIndex: 10000 }}>
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </>
  );

  return { showToast, ToastContainer };
}
