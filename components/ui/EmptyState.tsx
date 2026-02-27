/**
 * Empty State Components
 * 
 * User-friendly empty state displays:
 * - No data / no results
 * - Empty lists/tables
 * - Search no results
 * - Onboarding hints
 */

'use client';

/**
 * Empty state types
 */
export type EmptyStateType =
  | 'nodata'
  | 'noresults'
  | 'search'
  | 'filter'
  | 'new'
  | 'permission';

/**
 * Empty state icons
 */
const EMPTY_ICONS: Record<EmptyStateType, string> = {
  nodata: '📋',
  noresults: '🔍',
  search: '🔎',
  filter: '🔍',
  new: '✨',
  permission: '🔒',
};

/**
 * Empty state messages (Arabic)
 */
const EMPTY_MESSAGES: Record<EmptyStateType, { title: string; description: string }> = {
  nodata: {
    title: 'لا توجد بيانات',
    description: 'ابدأ بإضافة أول عنصر',
  },
  noresults: {
    title: 'لا توجد نتائج',
    description: 'لم نعثر على أي نتائج',
  },
  search: {
    title: 'لا توجد نتائج للبحث',
    description: 'جرب كلمات بحث مختلفة',
  },
  filter: {
    title: 'لا توجد نتائج للفلتر',
    description: 'جرب تغيير الفلاتر',
  },
  new: {
    title: 'ابدأ الآن!',
    description: 'أضف أول عنصر لتبدأ',
  },
  permission: {
    title: 'غير مسموح',
    description: 'ليس لديك صلاحية لعرض هذه البيانات',
  },
};

/**
 * Empty state component
 */
export function EmptyState({
  type = 'nodata',
  icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  secondary,
  secondaryLabel,
  onSecondary,
}: {
  type?: EmptyStateType;
  icon?: string | React.ReactNode;
  title?: string;
  description?: string;
  action?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  secondary?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const emptyInfo = EMPTY_MESSAGES[type];
  const displayIcon = icon !== undefined ? icon : EMPTY_ICONS[type];
  const displayTitle = title || emptyInfo.title;
  const displayDescription = description || emptyInfo.description;

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '4rem 1rem',
        maxWidth: '500px',
        margin: '0 auto',
      }}
    >
      {/* Icon */}
      <div
        style={{
          fontSize: '5rem',
          marginBottom: '1.5rem',
          opacity: 0.8,
        }}
      >
        {typeof displayIcon === 'string' ? displayIcon : displayIcon}
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#1F2937',
          marginBottom: '0.5rem',
        }}
      >
        {displayTitle}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: '1rem',
          color: '#6B7280',
          marginBottom: '2rem',
        }}
      >
        {displayDescription}
      </p>

      {/* Actions */}
      {(action || secondary) && (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {action && onAction && (
            <button
              onClick={onAction}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#2D1B4E',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a0f2e';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2D1B4E';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              ➕ {actionLabel || 'إضافة'}
            </button>
          )}

          {secondary && onSecondary && (
            <button
              onClick={onSecondary}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'transparent',
                color: '#2D1B4E',
                border: '2px solid #2D1B4E',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F3F4F6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {secondaryLabel || 'إلغاء'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Empty table row
 */
export function EmptyTableRow({ 
  columns, 
  message = 'لا توجد بيانات' 
}: { 
  columns: number; 
  message?: string;
}) {
  return (
    <tr>
      <td
        colSpan={columns}
        style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: '#6B7280',
          fontSize: '1rem',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>
          📋
        </div>
        <div>{message}</div>
      </td>
    </tr>
  );
}

/**
 * Empty list
 */
export function EmptyList({
  icon = '📋',
  message = 'لا توجد عناصر',
  action,
  onAction,
}: {
  icon?: string;
  message?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '2rem 1rem',
        backgroundColor: '#F9FAFB',
        borderRadius: '12px',
        border: '2px dashed #D1D5DB',
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '0.75rem', opacity: 0.6 }}>
        {icon}
      </div>
      <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
        {message}
      </p>
      {action && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#2D1B4E',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          ➕ {action}
        </button>
      )}
    </div>
  );
}

/**
 * Empty search results
 */
export function EmptySearch({
  query,
  onClear,
}: {
  query?: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      type="search"
      title="لا توجد نتائج للبحث"
      description={query ? `لم نعثر على نتائج لـ "${query}"` : 'جرب كلمات بحث مختلفة'}
      secondary={!!onClear}
      secondaryLabel="مسح البحث"
      onSecondary={onClear}
    />
  );
}

/**
 * Empty filter results
 */
export function EmptyFilter({
  onClear,
}: {
  onClear?: () => void;
}) {
  return (
    <EmptyState
      type="filter"
      title="لا توجد نتائج"
      description="لم نعثر على نتائج للفلاتر المحددة"
      secondary={!!onClear}
      secondaryLabel="إلغاء الفلاتر"
      onSecondary={onClear}
    />
  );
}

/**
 * Onboarding empty state
 */
export function OnboardingEmpty({
  title,
  description,
  steps,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  steps?: string[];
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '3rem 2rem',
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: '#F9FAFB',
        borderRadius: '16px',
        border: '2px dashed #D1D5DB',
      }}
    >
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
        ✨
      </div>
      <h3
        style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#1F2937',
          marginBottom: '0.5rem',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '1rem',
          color: '#6B7280',
          marginBottom: '2rem',
        }}
      >
        {description}
      </p>

      {steps && steps.length > 0 && (
        <div
          style={{
            textAlign: 'right',
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid #E5E7EB',
          }}
        >
          <h4
            style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '1rem',
            }}
          >
            الخطوات:
          </h4>
          <ol style={{ margin: 0, paddingRight: '1.5rem' }}>
            {steps.map((step, index) => (
              <li
                key={index}
                style={{
                  marginBottom: '0.5rem',
                  color: '#6B7280',
                  fontSize: '0.875rem',
                }}
              >
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      <button
        onClick={onAction}
        style={{
          padding: '0.875rem 2rem',
          backgroundColor: '#2D1B4E',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        🚀 {actionLabel}
      </button>
    </div>
  );
}

/**
 * Usage Examples:
 * 
 * 1. Basic empty state:
 * <EmptyState
 *   type="nodata"
 *   action
 *   actionLabel="إضافة موظف"
 *   onAction={() => router.push('/employees/new')}
 * />
 * 
 * 2. Empty search:
 * <EmptySearch
 *   query={searchQuery}
 *   onClear={() => setSearchQuery('')}
 * />
 * 
 * 3. Empty table:
 * {employees.length === 0 && (
 *   <EmptyTableRow columns={6} message="لا يوجد موظفين" />
 * )}
 * 
 * 4. Empty list:
 * <EmptyList
 *   icon="📋"
 *   message="لا توجد مهام"
 *   action="إضافة مهمة"
 *   onAction={() => setShowModal(true)}
 * />
 * 
 * 5. Onboarding:
 * <OnboardingEmpty
 *   title="مرحباً بك في نظام المهام"
 *   description="ابدأ بإضافة أول مهمة"
 *   steps={['اضغط على زر إضافة', 'املأ بيانات المهمة', 'احفظ']}
 *   actionLabel="إضافة أول مهمة"
 *   onAction={() => setShowModal(true)}
 * />
 */
