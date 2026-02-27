/**
 * Error State Components
 * 
 * User-friendly error displays:
 * - Error boundaries
 * - API error messages
 * - Form validation errors
 * - Network errors
 * - 404/403/500 pages
 */

'use client';

import { Component, ReactNode } from 'react';

/**
 * Error types
 */
export type ErrorType = 
  | 'network' 
  | 'auth' 
  | 'forbidden' 
  | 'notfound' 
  | 'validation' 
  | 'server' 
  | 'unknown';

/**
 * Error icons
 */
const ERROR_ICONS: Record<ErrorType, string> = {
  network: '🌐',
  auth: '🔒',
  forbidden: '⛔',
  notfound: '🔍',
  validation: '⚠️',
  server: '❌',
  unknown: '😕',
};

/**
 * Error messages (Arabic)
 */
const ERROR_MESSAGES: Record<ErrorType, { title: string; description: string }> = {
  network: {
    title: 'مشكلة في الاتصال',
    description: 'تحقق من الإنترنت وحاول مرة أخرى',
  },
  auth: {
    title: 'غير مصرح',
    description: 'يرجى تسجيل الدخول للمتابعة',
  },
  forbidden: {
    title: 'غير مسموح',
    description: 'ليس لديك صلاحية للوصول لهذه الصفحة',
  },
  notfound: {
    title: 'الصفحة غير موجودة',
    description: 'لم نتمكن من العثور على ما تبحث عنه',
  },
  validation: {
    title: 'بيانات غير صحيحة',
    description: 'يرجى التحقق من البيانات المدخلة',
  },
  server: {
    title: 'خطأ في الخادم',
    description: 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً',
  },
  unknown: {
    title: 'حدث خطأ',
    description: 'حدث خطأ غير متوقع',
  },
};

/**
 * Error display component
 */
export function ErrorState({
  type = 'unknown',
  title,
  message,
  onRetry,
  showDetails = false,
  details,
}: {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  showDetails?: boolean;
  details?: string;
}) {
  const errorInfo = ERROR_MESSAGES[type];
  const displayTitle = title || errorInfo.title;
  const displayMessage = message || errorInfo.description;

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '3rem 1rem',
        maxWidth: '500px',
        margin: '0 auto',
      }}
    >
      {/* Icon */}
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
        {ERROR_ICONS[type]}
      </div>

      {/* Title */}
      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#1F2937',
          marginBottom: '0.5rem',
        }}
      >
        {displayTitle}
      </h2>

      {/* Message */}
      <p
        style={{
          fontSize: '1rem',
          color: '#6B7280',
          marginBottom: '2rem',
        }}
      >
        {displayMessage}
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#2D1B4E',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1a0f2e';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2D1B4E';
            }}
          >
            🔄 حاول مرة أخرى
          </button>
        )}

        {type === 'notfound' && (
          <button
            onClick={() => (window.location.href = '/')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: '#2D1B4E',
              border: '2px solid #2D1B4E',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            🏠 الصفحة الرئيسية
          </button>
        )}

        {type === 'auth' && (
          <button
            onClick={() => (window.location.href = '/')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: '#2D1B4E',
              border: '2px solid #2D1B4E',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            🔑 تسجيل الدخول
          </button>
        )}
      </div>

      {/* Details (for debugging) */}
      {showDetails && details && (
        <details style={{ marginTop: '2rem', textAlign: 'right' }}>
          <summary
            style={{
              cursor: 'pointer',
              color: '#6B7280',
              fontSize: '0.875rem',
              marginBottom: '0.5rem',
            }}
          >
            تفاصيل تقنية
          </summary>
          <pre
            style={{
              backgroundColor: '#F3F4F6',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '0.75rem',
              color: '#374151',
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: '200px',
            }}
          >
            {details}
          </pre>
        </details>
      )}
    </div>
  );
}

/**
 * Inline error message (for forms)
 */
export function InlineError({ message }: { message: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem',
        backgroundColor: '#FEE2E2',
        border: '1px solid #FECACA',
        borderRadius: '8px',
        color: '#991B1B',
        fontSize: '0.875rem',
      }}
    >
      <span>⚠️</span>
      <span>{message}</span>
    </div>
  );
}

/**
 * Error banner (for page-level errors)
 */
export function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div
      style={{
        backgroundColor: '#FEE2E2',
        border: '1px solid #FECACA',
        borderRadius: '8px',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.5rem' }}>❌</span>
        <span style={{ color: '#991B1B', fontSize: '0.875rem', fontWeight: '500' }}>
          {message}
        </span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#991B1B',
            cursor: 'pointer',
            fontSize: '1.5rem',
            padding: 0,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

/**
 * Error boundary component
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorState
          type="unknown"
          onRetry={() => window.location.reload()}
          showDetails={process.env.NODE_ENV === 'development'}
          details={this.state.error?.stack}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Usage Examples:
 * 
 * 1. Error state:
 * <ErrorState
 *   type="network"
 *   onRetry={handleRetry}
 * />
 * 
 * 2. Custom error:
 * <ErrorState
 *   type="server"
 *   title="خطأ في الحفظ"
 *   message="تعذر حفظ البيانات"
 *   onRetry={handleSave}
 * />
 * 
 * 3. Inline error (forms):
 * {error && <InlineError message={error} />}
 * 
 * 4. Error banner:
 * {apiError && (
 *   <ErrorBanner
 *     message={apiError}
 *     onDismiss={() => setApiError(null)}
 *   />
 * )}
 * 
 * 5. Error boundary:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
