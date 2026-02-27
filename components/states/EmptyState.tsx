// Empty state components
import React from 'react';
import Link from 'next/link';

type EmptyPreset = 'search' | 'filter' | 'new' | 'noData' | 'permissions' | 'offline' | 'error' | 'loading' | 'maintenance' | 'comingSoon';
type EmptyVariant = 'default' | 'inline' | 'compact';

interface EmptyStateProps {
  preset?: EmptyPreset;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  showIcon?: boolean;
  variant?: EmptyVariant;
  className?: string;
}

const EMPTY_PRESETS: Record<EmptyPreset, { title: string; description: string; icon: React.ReactNode }> = {
  search: {
    title: 'لا توجد نتائج',
    description: 'لم يتم العثور على نتائج مطابقة لبحثك. حاول تعديل كلمات البحث.',
    icon: (
      <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  filter: {
    title: 'لا توجد نتائج',
    description: 'لم يتم العثور على نتائج تطابق الفلتر المحدد. حاول تغيير الفلتر.',
    icon: (
      <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
    ),
  },
  new: {
    title: 'ابدأ الآن',
    description: 'لم يتم إضافة أي عناصر بعد. ابدأ بإضافة أول عنصر.',
    icon: (
      <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  noData: {
    title: 'لا توجد بيانات',
    description: 'لا توجد بيانات لعرضها حالياً.',
    icon: (
      <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
  },
  permissions: {
    title: 'غير مصرح',
    description: 'لا تملك الصلاحيات اللازمة للوصول إلى هذا المحتوى.',
    icon: (
      <svg className="w-24 h-24 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  offline: {
    title: 'غير متصل',
    description: 'لا يوجد اتصال بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.',
    icon: (
      <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
      </svg>
    ),
  },
  error: {
    title: 'حدث خطأ',
    description: 'حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.',
    icon: (
      <svg className="w-24 h-24 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  loading: {
    title: 'جاري التحميل',
    description: 'يرجى الانتظار بينما نقوم بتحميل البيانات...',
    icon: (
      <svg className="w-24 h-24 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  maintenance: {
    title: 'صيانة',
    description: 'النظام قيد الصيانة حالياً. سنعود قريباً.',
    icon: (
      <svg className="w-24 h-24 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  comingSoon: {
    title: 'قريباً',
    description: 'هذه الميزة ستكون متاحة قريباً. تابع معنا!',
    icon: (
      <svg className="w-24 h-24 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export function EmptyState({
  preset,
  title,
  description,
  icon,
  action,
  secondaryAction,
  showIcon = true,
  variant = 'default',
  className = '',
}: EmptyStateProps) {
  // Get preset values if preset is provided
  const presetData = preset ? EMPTY_PRESETS[preset] : null;
  const finalTitle = title || presetData?.title || 'لا توجد بيانات';
  const finalDescription = description || presetData?.description || 'لم يتم العثور على أي بيانات حالياً.';
  const finalIcon = icon || (showIcon && presetData?.icon) || (showIcon && (
    <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ));

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={`empty-state-inline flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
        {showIcon && finalIcon && (
          <div className="flex-shrink-0">{finalIcon}</div>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{finalTitle}</p>
          {finalDescription !== finalTitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{finalDescription}</p>
          )}
        </div>
        {action && (
          action.href ? (
            <Link
              href={action.href}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium whitespace-nowrap"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium whitespace-nowrap"
            >
              {action.label}
            </button>
          )
        )}
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={`empty-state-compact flex flex-col items-center justify-center p-6 ${className}`}>
        {showIcon && finalIcon && (
          <div className="mb-3">{finalIcon}</div>
        )}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          {finalTitle}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
          {finalDescription}
        </p>
        {action && (
          action.href ? (
            <Link
              href={action.href}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {action.label}
            </button>
          )
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] text-center p-8 ${className}`}>
      {/* Illustration */}
      {showIcon && finalIcon && (
        <div className="mb-6 empty-icon">
          {finalIcon}
        </div>
      )}

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {finalTitle}
      </h3>

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
        {finalDescription}
      </p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
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

          {secondaryAction && (
            secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                onClick={secondaryAction.onClick}
                className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                {secondaryAction.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
