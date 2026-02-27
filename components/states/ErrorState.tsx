// Error state components
import React from 'react';
import Link from 'next/link';

type ErrorType = '404' | '403' | '500' | 'network' | 'timeout' | 'data';
type ErrorVariant = 'default' | 'inline' | 'compact';

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  onRetry?: () => void;
  showIcon?: boolean;
  variant?: ErrorVariant;
  className?: string;
}

const ERROR_PRESETS: Record<ErrorType, { title: string; message: string; icon: React.ReactNode }> = {
  '404': {
    title: 'الصفحة غير موجودة',
    message: 'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.',
    icon: (
      <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  '403': {
    title: 'غير مصرح',
    message: 'عذراً، لا تملك الصلاحيات اللازمة للوصول إلى هذه الصفحة.',
    icon: (
      <svg className="w-20 h-20 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  '500': {
    title: 'خطأ في الخادم',
    message: 'عذراً، حدث خطأ في الخادم. نعمل على إصلاحه في أقرب وقت.',
    icon: (
      <svg className="w-20 h-20 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  'network': {
    title: 'خطأ في الاتصال',
    message: 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى.',
    icon: (
      <svg className="w-20 h-20 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>
    ),
  },
  'timeout': {
    title: 'انتهت المهلة',
    message: 'استغرق الطلب وقتاً أطول من المتوقع. يرجى المحاولة مرة أخرى.',
    icon: (
      <svg className="w-20 h-20 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  'data': {
    title: 'خطأ في البيانات',
    message: 'حدث خطأ أثناء معالجة البيانات. يرجى المحاولة مرة أخرى.',
    icon: (
      <svg className="w-20 h-20 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export function ErrorState({
  type,
  title,
  message,
  icon,
  action,
  onRetry,
  showIcon = true,
  variant = 'default',
  className = '',
}: ErrorStateProps) {
  // Get preset values if type is provided
  const preset = type ? ERROR_PRESETS[type] : null;
  const finalTitle = title || preset?.title || 'حدث خطأ';
  const finalMessage = message || preset?.message || 'عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
  const finalIcon = icon || (showIcon && preset?.icon) || (showIcon && (
    <svg className="w-20 h-20 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ));

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={`error-state-inline flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
        {showIcon && (
          <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">{finalTitle}</p>
          {finalMessage !== finalTitle && (
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{finalMessage}</p>
          )}
        </div>
        {(onRetry || action) && (
          <button
            onClick={onRetry || action?.onClick}
            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium whitespace-nowrap"
          >
            {action?.label || 'إعادة المحاولة'}
          </button>
        )}
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={`error-state-compact flex flex-col items-center justify-center p-6 ${className}`}>
        {showIcon && finalIcon && (
          <div className="mb-3">{finalIcon}</div>
        )}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          {finalTitle}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
          {finalMessage}
        </p>
        {(onRetry || action) && (
          <button
            onClick={onRetry || action?.onClick}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {action?.label || 'إعادة المحاولة'}
          </button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] text-center p-8 ${className}`}>
      {/* Icon */}
      {showIcon && finalIcon && (
        <div className="mb-6 error-icon">
          {finalIcon}
        </div>
      )}

      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
        {finalTitle}
      </h2>

      {/* Message */}
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
        {finalMessage}
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        )}

        {action && (
          action.href ? (
            <Link
              href={action.href}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {action.label}
            </button>
          )
        )}

        <Link
          href="/"
          className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}

// Predefined error components (for backward compatibility)

export function Error404() {
  return <ErrorState type="404" />;
}

export function Error403() {
  return <ErrorState type="403" />;
}

export function Error500() {
  return <ErrorState type="500" />;
}

export function ErrorNetwork() {
  return <ErrorState type="network" />;
}

export function ErrorTimeout() {
  return <ErrorState type="timeout" />;
}

export function ErrorDataLoad() {
  return <ErrorState type="data" />;
}
