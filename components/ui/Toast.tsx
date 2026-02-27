/**
 * Toast Notifications
 * 
 * Lightweight notification system:
 * - Success/Error/Warning/Info toasts
 * - Auto-dismiss
 * - Stackable
 * - Animated
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Toast types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast interface
 */
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

/**
 * Toast icons
 */
const TOAST_ICONS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

/**
 * Toast colors
 */
const TOAST_COLORS: Record<ToastType, { bg: string; border: string; text: string }> = {
  success: {
    bg: '#D1FAE5',
    border: '#10B981',
    text: '#065F46',
  },
  error: {
    bg: '#FEE2E2',
    border: '#EF4444',
    text: '#991B1B',
  },
  warning: {
    bg: '#FEF3C7',
    border: '#F59E0B',
    text: '#92400E',
  },
  info: {
    bg: '#DBEAFE',
    border: '#3B82F6',
    text: '#1E40AF',
  },
};

/**
 * Toast context
 */
interface ToastContextValue {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Toast provider
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: ToastType, message: string, duration: number = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = { id, type, message, duration };

    setToasts((prev) => [...prev, toast]);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const success = (message: string, duration?: number) => addToast('success', message, duration);
  const error = (message: string, duration?: number) => addToast('error', message, duration);
  const warning = (message: string, duration?: number) => addToast('warning', message, duration);
  const info = (message: string, duration?: number) => addToast('info', message, duration);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Use toast hook
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

/**
 * Toast container
 */
function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        minWidth: '320px',
        maxWidth: '500px',
        width: '90%',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/**
 * Toast item
 */
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  const colors = TOAST_COLORS[toast.type];

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
        <span style={{ fontSize: '1.25rem' }}>{TOAST_ICONS[toast.type]}</span>
        <span
          style={{
            color: colors.text,
            fontSize: '0.875rem',
            fontWeight: '500',
          }}
        >
          {toast.message}
        </span>
      </div>
      <button
        onClick={handleDismiss}
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          color: colors.text,
          cursor: 'pointer',
          fontSize: '1.25rem',
          padding: 0,
          lineHeight: 1,
          opacity: 0.7,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.7';
        }}
      >
        ×
      </button>
    </div>
  );
}

/**
 * Standalone toast functions (without context)
 * For use in API calls, utilities, etc.
 */
let globalToastFn: ((type: ToastType, message: string, duration?: number) => void) | null = null;

export function setGlobalToast(fn: (type: ToastType, message: string, duration?: number) => void) {
  globalToastFn = fn;
}

export const toast = {
  success: (message: string, duration?: number) => {
    if (globalToastFn) globalToastFn('success', message, duration);
  },
  error: (message: string, duration?: number) => {
    if (globalToastFn) globalToastFn('error', message, duration);
  },
  warning: (message: string, duration?: number) => {
    if (globalToastFn) globalToastFn('warning', message, duration);
  },
  info: (message: string, duration?: number) => {
    if (globalToastFn) globalToastFn('info', message, duration);
  },
};

/**
 * Usage Examples:
 * 
 * 1. Setup ToastProvider (in layout):
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <ToastProvider>
 *           {children}
 *         </ToastProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * 
 * 2. Use toast in component:
 * const toast = useToast();
 * 
 * toast.success('تم الحفظ بنجاح!');
 * toast.error('حدث خطأ في الحفظ');
 * toast.warning('تحذير: البيانات غير كاملة');
 * toast.info('معلومة: يمكنك استخدام Ctrl+S للحفظ');
 * 
 * 3. Custom duration:
 * toast.success('تم الحفظ', 5000); // 5 seconds
 * 
 * 4. In API calls (standalone):
 * import { toast } from '@/components/ui/Toast';
 * 
 * try {
 *   await saveData();
 *   toast.success('تم الحفظ بنجاح!');
 * } catch (error) {
 *   toast.error('حدث خطأ في الحفظ');
 * }
 * 
 * 5. Enable global toast (in layout):
 * 'use client';
 * 
 * import { ToastProvider, setGlobalToast, useToast } from '@/components/ui/Toast';
 * 
 * function ToastSetup() {
 *   const { addToast } = useToast();
 *   useEffect(() => {
 *     setGlobalToast(addToast);
 *   }, [addToast]);
 *   return null;
 * }
 * 
 * export default function Layout({ children }) {
 *   return (
 *     <ToastProvider>
 *       <ToastSetup />
 *       {children}
 *     </ToastProvider>
 *   );
 * }
 */
