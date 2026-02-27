# Error & Empty States Usage Guide

## 📚 Overview

نظام متكامل لحالات الأخطاء والحالات الفارغة:
- **Error States** - رسائل خطأ احترافية
- **Empty States** - حالات فارغة مفيدة
- **Error Boundary** - التقاط أخطاء React
- **Inline States** - حالات مدمجة للـ components

---

## 🚨 Error States

### 1. ErrorState - العام

```tsx
import { ErrorState } from '@/components/states';

<ErrorState
  title="حدث خطأ"
  message="عذراً، حدث خطأ غير متوقع"
  action={{
    label: 'إعادة المحاولة',
    onClick: () => window.location.reload(),
  }}
  secondaryAction={{
    label: 'العودة للرئيسية',
    href: '/',
  }}
  showHomeButton={true}
/>
```

### 2. أخطاء HTTP جاهزة

```tsx
import {
  Error404,
  Error403,
  Error500,
  ErrorNetwork,
  ErrorTimeout,
} from '@/components/states';

// 404 - Not Found
<Error404 />

// 403 - Forbidden
<Error403 />

// 500 - Server Error
<Error500 />

// Network Error
<ErrorNetwork />

// Timeout Error
<ErrorTimeout />
```

### 3. InlineError - للـ Forms & Cards

```tsx
import { InlineError } from '@/components/states';

<InlineError
  message="فشل حفظ البيانات. يرجى المحاولة مرة أخرى."
  onRetry={() => handleSubmit()}
/>
```

---

## 📭 Empty States

### 1. EmptyState - العام

```tsx
import { EmptyState } from '@/components/states';

<EmptyState
  title="لا توجد بيانات"
  message="لم يتم العثور على أي بيانات"
  illustration="default"
  action={{
    label: 'إضافة جديد',
    href: '/new',
  }}
/>
```

### 2. حالات فارغة جاهزة

```tsx
import {
  EmptyTasks,
  EmptyEmployees,
  EmptySearchResults,
  EmptyNotifications,
  EmptyFiles,
  EmptyCalendar,
  EmptyAttendance,
  EmptyLeaveRequests,
  EmptyPurchaseRequests,
  EmptyReports,
} from '@/components/states';

// No tasks
<EmptyTasks />

// No employees
<EmptyEmployees />

// No search results
<EmptySearchResults query="محمد" />

// No notifications
<EmptyNotifications />

// No files
<EmptyFiles />

// No calendar events
<EmptyCalendar />

// No attendance records
<EmptyAttendance date="2026-02-24" />

// No leave requests
<EmptyLeaveRequests />

// No purchase requests
<EmptyPurchaseRequests />

// No reports
<EmptyReports />
```

### 3. InlineEmpty - للـ Cards & Tables

```tsx
import { InlineEmpty } from '@/components/states';

<InlineEmpty
  message="لا توجد مهام"
  action={{
    label: 'إضافة مهمة',
    onClick: () => setShowModal(true),
  }}
/>
```

### 4. TableEmpty - للجداول

```tsx
import { TableEmpty } from '@/components/states';

<table>
  <thead>...</thead>
  <tbody>
    {data.length === 0 ? (
      <TableEmpty columns={5} message="لا توجد بيانات" />
    ) : (
      data.map((row) => <tr key={row.id}>...</tr>)
    )}
  </tbody>
</table>
```

---

## 🛡️ Error Boundary

### 1. ErrorBoundary Component

```tsx
import { ErrorBoundary } from '@/components/states/ErrorBoundary';

export default function MyApp({ children }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Error:', error);
        // Send to monitoring service
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### 2. Custom Fallback

```tsx
import { ErrorBoundary } from '@/components/states/ErrorBoundary';
import { ErrorState } from '@/components/states';

<ErrorBoundary
  fallback={
    <ErrorState
      title="خطأ في التطبيق"
      message="حدث خطأ غير متوقع"
      action={{
        label: 'إعادة تحميل الصفحة',
        onClick: () => window.location.reload(),
      }}
    />
  }
>
  <MyComponent />
</ErrorBoundary>
```

### 3. withErrorBoundary HOC

```tsx
import { withErrorBoundary } from '@/components/states/ErrorBoundary';

function MyComponent() {
  // Component code
}

export default withErrorBoundary(MyComponent);

// With custom fallback
export default withErrorBoundary(
  MyComponent,
  <div>Custom error message</div>,
  (error) => console.error(error)
);
```

### 4. useErrorHandler Hook

```tsx
'use client';

import { useErrorHandler } from '@/components/states/ErrorBoundary';

export default function MyComponent() {
  const throwError = useErrorHandler();

  async function fetchData() {
    try {
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error('Failed to fetch');
    } catch (error) {
      throwError(error); // Will be caught by nearest ErrorBoundary
    }
  }

  return <div>...</div>;
}
```

---

## 🎯 أمثلة عملية

### مثال 1: صفحة مع Error Handling

```tsx
'use client';

import { useState, useEffect } from 'react';
import { ErrorDataLoad, EmptyEmployees, TablePageLoading } from '@/components/states';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/employees');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <TablePageLoading />;
  if (error) return <ErrorDataLoad />;
  if (employees.length === 0) return <EmptyEmployees />;

  return (
    <div>
      {/* Employees table */}
    </div>
  );
}
```

### مثال 2: Form مع Inline Error

```tsx
'use client';

import { useState } from 'react';
import { InlineError, LoadingButton } from '@/components/loading';

export default function EmployeeForm() {
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save');
      }

      alert('تم الحفظ بنجاح');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}

      {error && (
        <InlineError
          message={error}
          onRetry={handleSubmit}
        />
      )}

      <LoadingButton loading={saving} type="submit">
        حفظ
      </LoadingButton>
    </form>
  );
}
```

### مثال 3: Table مع Empty State

```tsx
'use client';

import { TableEmpty } from '@/components/states';

export default function TasksTable({ tasks }) {
  return (
    <table>
      <thead>
        <tr>
          <th>العنوان</th>
          <th>الحالة</th>
          <th>التاريخ</th>
        </tr>
      </thead>
      <tbody>
        {tasks.length === 0 ? (
          <TableEmpty columns={3} message="لا توجد مهام" />
        ) : (
          tasks.map((task) => (
            <tr key={task.id}>
              <td>{task.title}</td>
              <td>{task.status}</td>
              <td>{task.date}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
```

### مثال 4: Search Results

```tsx
'use client';

import { EmptySearchResults } from '@/components/states';

export default function SearchResults({ query, results }) {
  if (results.length === 0) {
    return <EmptySearchResults query={query} />;
  }

  return (
    <div>
      {results.map((result) => (
        <div key={result.id}>{result.title}</div>
      ))}
    </div>
  );
}
```

### مثال 5: Error Boundary في Root Layout

```tsx
// app/layout.tsx
import { ErrorBoundary } from '@/components/states/ErrorBoundary';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary
          onError={(error, errorInfo) => {
            // Log to monitoring service
            if (typeof window !== 'undefined' && window.Sentry) {
              window.Sentry.captureException(error);
            }
          }}
        >
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

### مثال 6: Custom Error Pages

```tsx
// app/error.tsx (Next.js App Router)
'use client';

import { Error500 } from '@/components/states';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <Error500 />;
}

// app/not-found.tsx
import { Error404 } from '@/components/states';

export default function NotFound() {
  return <Error404 />;
}
```

---

## 📋 Illustrations Available

للـ EmptyState يمكنك استخدام أحد الرسوم التوضيحية الجاهزة:

- `default` - صندوق فارغ عام
- `tasks` - قائمة مهام فارغة
- `employees` - مجموعة موظفين فارغة
- `search` - بحث بلا نتائج
- `files` - ملفات فارغة
- `calendar` - تقويم فارغ
- `notifications` - إشعارات فارغة

```tsx
<EmptyState
  title="لا توجد ملفات"
  message="لم يتم رفع أي ملفات بعد"
  illustration="files"
/>
```

---

## 🎨 تخصيص المظهر

### Custom Icon

```tsx
<EmptyState
  title="Custom State"
  message="With custom icon"
  icon={
    <svg className="w-24 h-24 text-purple-500">
      {/* Custom SVG */}
    </svg>
  }
/>
```

### Custom Styling

```tsx
<EmptyState
  title="Styled State"
  message="With custom class"
  className="bg-blue-50 rounded-lg p-8"
/>
```

---

## 🚀 Best Practices

### 1. دائماً استخدم Error Boundary

```tsx
// ✅ Good
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>

// ❌ Bad - أي خطأ سيكسر التطبيق كله
<MyComponent />
```

### 2. Error States للأخطاء الكبيرة، Inline للصغيرة

```tsx
// ✅ Error State - لفشل تحميل الصفحة كاملة
if (error) return <ErrorDataLoad />;

// ✅ Inline Error - لفشل في form field
{fieldError && <InlineError message={fieldError} />}
```

### 3. Empty States مع Actions دائماً

```tsx
// ❌ Bad - بدون action
<EmptyState title="لا توجد بيانات" />

// ✅ Good - مع action
<EmptyState
  title="لا توجد بيانات"
  action={{
    label: 'إضافة جديد',
    href: '/new',
  }}
/>
```

### 4. استخدم Predefined Components

```tsx
// ❌ Bad - إعادة كتابة نفس الكود
<EmptyState
  title="لا توجد مهام"
  message="لم يتم إنشاء أي مهام بعد"
  action={{ label: 'إضافة مهمة', href: '/tasks/new' }}
/>

// ✅ Good - استخدم الجاهز
<EmptyTasks />
```

### 5. رسائل واضحة ومفيدة

```tsx
// ❌ Bad
<ErrorState title="Error" message="Something went wrong" />

// ✅ Good
<ErrorState
  title="فشل حفظ البيانات"
  message="تحقق من اتصالك بالإنترنت وحاول مرة أخرى"
  action={{
    label: 'إعادة المحاولة',
    onClick: () => handleRetry(),
  }}
/>
```

---

## ✅ Checklist

- [ ] ErrorBoundary في Root Layout
- [ ] error.tsx و not-found.tsx مع Error States
- [ ] كل fetch فيه error handling
- [ ] Empty States لكل list/table
- [ ] Inline Errors في Forms
- [ ] Actions في Empty States
- [ ] رسائل واضحة بالعربية
- [ ] Retry options للأخطاء المؤقتة

---

**Status:** ✅ Ready to use
**Components:** 25+ error & empty state components
**Size:** ~19 KB (compressed)
**Accessibility:** Full keyboard & screen reader support
