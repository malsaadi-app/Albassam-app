# 📦 Components Documentation

**Enhanced UI Components Library for Albassam Tasks Application**

Created: March 10, 2026  
Version: 1.0.0  
Week 1: Days 1-5 Complete

---

## 📑 Table of Contents

1. [Layout Components](#layout-components)
2. [Form Components](#form-components)
3. [Data Display](#data-display)
4. [Feedback Components](#feedback-components)
5. [Navigation Components](#navigation-components)
6. [Mobile Components](#mobile-components)
7. [Utility Hooks](#utility-hooks)
8. [Animations](#animations)

---

## 🏗️ Layout Components

### SidebarEnhanced
**Path:** `/app/components/SidebarEnhanced.tsx`

Enhanced sidebar with smooth animations, collapsible sections, and RTL support.

**Features:**
- ✅ Collapsible menu sections
- ✅ Badge notifications
- ✅ Search functionality
- ✅ Smooth animations (cubic-bezier)
- ✅ Gradient backgrounds
- ✅ Pulse badges
- ✅ RTL/LTR support
- ✅ Mobile responsive

**Usage:**
```tsx
import SidebarEnhanced from '@/components/SidebarEnhanced';

<SidebarEnhanced />
```

---

### TopBarEnhanced
**Path:** `/app/components/TopBarEnhanced.tsx`

Full-width sticky header with breadcrumbs, search, and user menu.

**Features:**
- ✅ Breadcrumb navigation
- ✅ User profile dropdown
- ✅ Quick search modal (⌘K / Ctrl+K)
- ✅ Notification badges
- ✅ Scroll effects (backdrop blur)
- ✅ Mobile hamburger menu
- ✅ RTL support

**Usage:**
```tsx
import TopBarEnhanced from '@/components/TopBarEnhanced';

<TopBarEnhanced />
```

---

### ResponsiveContainer
**Path:** `/components/layout/ResponsiveContainer.tsx`

Responsive container with max-width and padding.

**Props:**
- `size`: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
- `className`: string (optional)
- `style`: CSSProperties (optional)

**Usage:**
```tsx
import { ResponsiveContainer } from '@/components/layout/ResponsiveContainer';

<ResponsiveContainer size="xl">
  {/* Your content */}
</ResponsiveContainer>
```

---

### ResponsiveGrid
**Path:** `/components/layout/ResponsiveContainer.tsx`

Auto-responsive grid layout.

**Props:**
- `columns`: { mobile?: number; tablet?: number; desktop?: number }
- `gap`: 'sm' | 'md' | 'lg'
- `className`: string (optional)
- `style`: CSSProperties (optional)

**Usage:**
```tsx
import { ResponsiveGrid } from '@/components/layout/ResponsiveContainer';

<ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="md">
  <Card />
  <Card />
  <Card />
</ResponsiveGrid>
```

---

### ResponsiveStack
**Path:** `/components/layout/ResponsiveContainer.tsx`

Flex container with responsive direction.

**Props:**
- `direction`: 'vertical' | 'horizontal' | 'responsive'
- `gap`: 'sm' | 'md' | 'lg'
- `align`: 'start' | 'center' | 'end' | 'stretch'
- `justify`: 'start' | 'center' | 'end' | 'between' | 'around'
- `style`: CSSProperties (optional)

**Usage:**
```tsx
import { ResponsiveStack } from '@/components/layout/ResponsiveContainer';

<ResponsiveStack direction="responsive" gap="md">
  <Button />
  <Button />
</ResponsiveStack>
```

---

## 📝 Form Components

### FloatingInput
**Path:** `/components/ui/FormEnhanced.tsx`

Input with floating label animation.

**Props:**
- `label`: string (required)
- `error`: string (optional)
- `success`: string (optional)
- `helper`: string (optional)
- `icon`: React.ReactNode (optional)
- `clearable`: boolean (optional)
- `onClear`: () => void (optional)
- All standard HTML input props

**Usage:**
```tsx
import { FloatingInput } from '@/components/ui/FormEnhanced';

<FloatingInput
  label="البريد الإلكتروني"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  clearable
  onClear={() => setEmail('')}
/>
```

---

### FloatingSelect
**Path:** `/components/ui/FormEnhanced.tsx`

Select dropdown with floating label.

**Props:**
- `label`: string (required)
- `options`: Array<{ value: string; label: string }>
- `error`: string (optional)
- `helper`: string (optional)
- All standard HTML select props

**Usage:**
```tsx
import { FloatingSelect } from '@/components/ui/FormEnhanced';

<FloatingSelect
  label="القسم"
  value={department}
  onChange={(e) => setDepartment(e.target.value)}
  options={[
    { value: 'hr', label: 'الموارد البشرية' },
    { value: 'it', label: 'تقنية المعلومات' },
  ]}
/>
```

---

### FloatingTextarea
**Path:** `/components/ui/FormEnhanced.tsx`

Textarea with floating label.

**Props:**
- `label`: string (required)
- `error`: string (optional)
- `helper`: string (optional)
- All standard HTML textarea props

**Usage:**
```tsx
import { FloatingTextarea } from '@/components/ui/FormEnhanced';

<FloatingTextarea
  label="الملاحظات"
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
  rows={4}
/>
```

---

### Checkbox & Radio
**Path:** `/components/ui/FormEnhanced.tsx`

Enhanced checkbox and radio buttons.

**Usage:**
```tsx
import { Checkbox, Radio } from '@/components/ui/FormEnhanced';

<Checkbox
  label="أوافق على الشروط"
  checked={agreed}
  onChange={(e) => setAgreed(e.target.checked)}
/>

<Radio
  label="الخطة الأساسية"
  name="plan"
  value="basic"
  checked={plan === 'basic'}
  onChange={(e) => setPlan(e.target.value)}
/>
```

---

### FileUpload
**Path:** `/components/ui/FormEnhanced.tsx`

File upload with drag-drop and preview.

**Props:**
- `label`: string (default: 'اختر ملف')
- `accept`: string (optional)
- `multiple`: boolean (optional)
- `onChange`: (files: FileList | null) => void
- `maxSize`: number (MB, default: 10)
- `hint`: string (optional)
- `error`: string (optional)

**Usage:**
```tsx
import { FileUpload } from '@/components/ui/FormEnhanced';

<FileUpload
  label="اختر الملفات"
  accept="image/*,.pdf"
  multiple
  maxSize={5}
  onChange={(files) => console.log(files)}
/>
```

---

## 📊 Data Display

### TableEnhanced
**Path:** `/components/ui/TableEnhanced.tsx`

Feature-rich data table.

**Features:**
- ✅ Sortable columns (click header to sort)
- ✅ Row selection (checkboxes)
- ✅ Bulk actions
- ✅ Search
- ✅ Pagination (10/25/50/100 per page)
- ✅ Export to CSV
- ✅ Loading state
- ✅ Empty state
- ✅ RTL support

**Props:**
- `data`: T[] (required)
- `columns`: Column<T>[] (required)
- `loading`: boolean (optional)
- `selectable`: boolean (optional)
- `onRowSelect`: (ids: string[]) => void (optional)
- `searchable`: boolean (default: true)
- `exportable`: boolean (default: true)
- `pageSize`: number (default: 10)
- `emptyMessage`: string (optional)
- `rowKey`: keyof T | ((row: T) => string) (default: 'id')
- `bulkActions`: React.ReactNode (optional)

**Usage:**
```tsx
import { TableEnhanced, Column } from '@/components/ui/TableEnhanced';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const columns: Column<User>[] = [
  { key: 'name', label: 'الاسم', sortable: true },
  { key: 'email', label: 'البريد', sortable: true },
  { 
    key: 'role', 
    label: 'الدور',
    render: (row) => <Badge>{row.role}</Badge>
  },
];

<TableEnhanced
  data={users}
  columns={columns}
  selectable
  onRowSelect={(ids) => console.log('Selected:', ids)}
  bulkActions={
    <button onClick={handleDelete}>حذف</button>
  }
/>
```

---

### CardEnhanced
**Path:** `/components/ui/CardEnhanced.tsx`

Versatile card component with multiple variants.

**Variants:**
- `default` - Standard card
- `outlined` - Blue border
- `elevated` - Shadow effect
- `gradient` - Purple gradient
- `stats` - Pink gradient
- `success` - Green gradient
- `warning` - Yellow gradient
- `danger` - Red gradient

**Props:**
- `variant`: CardVariant (default: 'default')
- `hoverable`: boolean (optional)
- `loading`: boolean (optional)
- `className`: string (optional)
- `style`: CSSProperties (optional)
- `onClick`: () => void (optional)

**Usage:**
```tsx
import { CardEnhanced, CardHeader, CardBody, CardFooter } from '@/components/ui/CardEnhanced';

<CardEnhanced variant="elevated" hoverable>
  <CardHeader
    icon={<HiOutlineUser size={24} />}
    title="عنوان الكارد"
    subtitle="وصف مختصر"
    actions={<button>عرض</button>}
  />
  <CardBody>
    المحتوى هنا
  </CardBody>
  <CardFooter>
    <span>آخر تحديث: اليوم</span>
    <button>حفظ</button>
  </CardFooter>
</CardEnhanced>
```

---

### StatsCard
**Path:** `/components/ui/CardEnhanced.tsx`

Quick stats display card.

**Props:**
- `icon`: React.ReactNode (optional)
- `label`: string (required)
- `value`: string | number (required)
- `change`: { value: string; isPositive: boolean } (optional)
- `variant`: 'gradient' | 'stats' | 'success' | 'warning' | 'danger'
- `hoverable`: boolean (optional)
- `onClick`: () => void (optional)

**Usage:**
```tsx
import { StatsCard } from '@/components/ui/CardEnhanced';

<StatsCard
  icon={<HiOutlineUser size={28} />}
  label="إجمالي المستخدمين"
  value="1,234"
  change={{ value: '+12%', isPositive: true }}
  variant="gradient"
  hoverable
/>
```

---

### Badge
**Path:** `/components/ui/TableEnhanced.tsx`

Small status indicator.

**Types:**
- `success` - Green
- `warning` - Yellow
- `danger` - Red
- `info` - Blue
- `gray` - Gray

**Usage:**
```tsx
import { Badge } from '@/components/ui/TableEnhanced';

<Badge type="success">نشط</Badge>
<Badge type="warning">معلق</Badge>
<Badge type="danger">محذوف</Badge>
```

---

## 💬 Feedback Components

### ModalEnhanced
**Path:** `/components/ui/ModalEnhanced.tsx`

Full-featured modal dialog.

**Features:**
- ✅ Portal-based rendering
- ✅ 5 sizes (sm, md, lg, xl, full)
- ✅ ESC key to close
- ✅ Click outside to close
- ✅ Body scroll lock
- ✅ Smooth animations
- ✅ RTL support

**Props:**
- `isOpen`: boolean (required)
- `onClose`: () => void (required)
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full' (default: 'md')
- `closeOnOverlayClick`: boolean (default: true)
- `closeOnEscape`: boolean (default: true)
- `showCloseButton`: boolean (default: true)

**Usage:**
```tsx
import { ModalEnhanced, ModalHeader, ModalBody, ModalFooter, ModalButton } from '@/components/ui/ModalEnhanced';

<ModalEnhanced isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
  <ModalHeader
    icon={<HiOutlineUser size={32} />}
    title="العنوان"
    subtitle="الوصف"
  />
  <ModalBody>
    المحتوى
  </ModalBody>
  <ModalFooter>
    <ModalButton onClick={() => setIsOpen(false)}>إلغاء</ModalButton>
    <ModalButton variant="primary" onClick={handleSave}>حفظ</ModalButton>
  </ModalFooter>
</ModalEnhanced>
```

---

### ConfirmDialog
**Path:** `/components/ui/ModalEnhanced.tsx`

Quick confirmation dialog.

**Props:**
- `isOpen`: boolean (required)
- `onClose`: () => void (required)
- `onConfirm`: () => void (required)
- `title`: string (required)
- `message`: string (required)
- `confirmText`: string (default: 'تأكيد')
- `cancelText`: string (default: 'إلغاء')
- `variant`: 'warning' | 'danger' | 'success' | 'info' (default: 'warning')

**Usage:**
```tsx
import { ConfirmDialog } from '@/components/ui/ModalEnhanced';

<ConfirmDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleDelete}
  title="تأكيد الحذف"
  message="هل أنت متأكد من حذف هذا العنصر؟"
  variant="danger"
/>
```

---

### Toast Notifications
**Path:** `/components/ui/Toast.tsx`

Context-based toast notifications.

**Features:**
- ✅ 4 types (success, error, warning, info)
- ✅ 6 positions
- ✅ Auto-dismiss with progress bar
- ✅ Manual close
- ✅ Smooth animations
- ✅ RTL support
- ✅ Mobile responsive

**Setup:**
```tsx
// In app/layout.tsx or app/providers.tsx
import { ToastProvider } from '@/components/ui/Toast';

<ToastProvider position="top-right">
  {children}
</ToastProvider>
```

**Usage:**
```tsx
import { useToast } from '@/components/ui/Toast';

function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('تم الحفظ بنجاح!', 'نجاح');
  };

  const handleError = () => {
    toast.error('حدث خطأ!', 'خطأ');
  };

  const handleWarning = () => {
    toast.warning('تحذير!', 'انتبه');
  };

  const handleInfo = () => {
    toast.info('معلومة جديدة', 'ملاحظة');
  };
}
```

---

### Loading States
**Path:** `/components/ui/LoadingStates.tsx`

Various loading indicators.

**Components:**
- `Spinner` - Classic spinner (sm/md/lg)
- `DotsSpinner` - Three bouncing dots
- `PulseSpinner` - Pulsing circle
- `BarsSpinner` - Animated bars
- `FullPageLoading` - Full screen overlay
- `LoadingOverlay` - Component overlay
- `ProgressBar` - Progress indicator
- `SkeletonText` - Text placeholder
- `SkeletonCard` - Card placeholder
- `SkeletonTable` - Table placeholder

**Usage:**
```tsx
import { Spinner, DotsSpinner, SkeletonCard, ProgressBar } from '@/components/ui/LoadingStates';

<Spinner size="lg" />
<DotsSpinner />
<ProgressBar value={75} /> {/* 0-100 or undefined for indeterminate */}
<SkeletonCard />
```

---

## 📱 Mobile Components

### MobileActionSheet
**Path:** `/components/ui/MobileActionSheet.tsx`

Bottom sheet for mobile actions.

**Features:**
- ✅ Swipe to dismiss
- ✅ Portal-based
- ✅ Desktop fallback (centered modal)
- ✅ Safe area support
- ✅ RTL support

**Usage:**
```tsx
import { MobileActionSheet, ActionItem, ActionSheetDivider } from '@/components/ui/MobileActionSheet';

<MobileActionSheet
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="الإجراءات"
  subtitle="اختر إجراء"
>
  <ActionItem
    icon={<HiOutlineUser size={20} />}
    title="عرض الملف"
    description="شاهد التفاصيل"
    onClick={() => {}}
  />
  
  <ActionSheetDivider />
  
  <ActionItem
    icon={<HiOutlineTrash size={20} />}
    title="حذف"
    onClick={() => {}}
    danger
  />
</MobileActionSheet>
```

---

## 🎣 Utility Hooks

### useMediaQuery
**Path:** `/hooks/useMediaQuery.ts`

Responsive breakpoint detection.

**Hooks:**
- `useMediaQuery(query: string)` - Custom query
- `useIsMobile()` - <= 767px
- `useIsTablet()` - 768px - 1023px
- `useIsDesktop()` - >= 1024px
- `useIsSmallScreen()` - <= 639px
- `useIsLargeScreen()` - >= 1280px
- `useIsPortrait()` - Portrait orientation
- `useIsLandscape()` - Landscape orientation
- `useIsTouchDevice()` - Touch support
- `useResponsiveValue({ mobile, tablet, desktop, default })` - Responsive values

**Usage:**
```tsx
import { useIsMobile, useResponsiveValue } from '@/hooks/useMediaQuery';

const isMobile = useIsMobile();
const columns = useResponsiveValue({
  mobile: 1,
  tablet: 2,
  desktop: 3,
  default: 1
});
```

---

### useSwipe
**Path:** `/hooks/useSwipe.ts`

Swipe gesture detection.

**Usage:**
```tsx
import { useSwipe } from '@/hooks/useSwipe';
import { useRef } from 'react';

const elementRef = useRef<HTMLDivElement>(null);

useSwipe(elementRef, {
  onSwipeLeft: () => console.log('Swiped left'),
  onSwipeRight: () => console.log('Swiped right'),
  onSwipeUp: () => console.log('Swiped up'),
  onSwipeDown: () => console.log('Swiped down'),
  threshold: 50,
});

<div ref={elementRef}>Swipe me!</div>
```

---

### useLongPress
**Path:** `/hooks/useSwipe.ts`

Long press detection.

**Usage:**
```tsx
import { useLongPress } from '@/hooks/useSwipe';
import { useRef } from 'react';

const elementRef = useRef<HTMLButtonElement>(null);

useLongPress(elementRef, {
  onLongPress: () => console.log('Long pressed!'),
  duration: 500,
  onStart: () => console.log('Press started'),
  onCancel: () => console.log('Press cancelled'),
});

<button ref={elementRef}>Long press me!</button>
```

---

## 🎨 Animations

### Animation Classes
**Path:** `/styles/animations.module.css`

Ready-to-use animation classes.

**Fade:**
- `fadeIn` - Fade in
- `fadeOut` - Fade out
- `fadeInUp` - Fade in from below
- `fadeInDown` - Fade in from above
- `fadeInLeft` - Fade in from left
- `fadeInRight` - Fade in from right

**Scale:**
- `scaleIn` - Scale in
- `scaleOut` - Scale out
- `pulse` - Pulsing animation
- `heartbeat` - Heartbeat effect

**Rotate:**
- `spin` - Continuous spin
- `spinSlow` - Slow spin
- `spinReverse` - Reverse spin

**Movement:**
- `bounce` - Bouncing
- `bounceIn` - Bounce in
- `shake` - Shake effect
- `wiggle` - Wiggle effect

**Transitions:**
- `transitionAll` - Smooth all transitions
- `transitionColors` - Color transitions
- `transitionTransform` - Transform transitions
- `transitionOpacity` - Opacity transitions

**Hover:**
- `hoverLift` - Lift on hover
- `hoverScale` - Scale on hover
- `hoverGlow` - Glow on hover

**Stagger:**
- `staggerFadeIn` - Stagger children fade in

**Skeleton:**
- `skeleton` - Loading shimmer

**Usage:**
```tsx
import styles from '@/styles/animations.module.css';

<div className={styles.fadeInUp}>
  Animated content
</div>

<div className={`${styles.pulse} ${styles.hoverLift}`}>
  Pulsing card
</div>
```

---

## 🎯 Best Practices

### Performance
1. Use `React.memo()` for expensive components
2. Use `useMemo()` and `useCallback()` appropriately
3. Lazy load heavy components with `dynamic()`
4. Use skeleton loaders for better perceived performance

### Accessibility
1. Always include `aria-label` on icon buttons
2. Use semantic HTML elements
3. Ensure keyboard navigation works
4. Test with screen readers
5. Respect `prefers-reduced-motion`

### Mobile
1. Use touch-friendly sizes (min 44px)
2. Test on real devices
3. Use `useIsMobile()` for conditional rendering
4. Implement swipe gestures where appropriate
5. Test with slow 3G network

### RTL Support
1. All components support RTL automatically
2. Use `dir="rtl"` on root element
3. Test both LTR and RTL layouts
4. Avoid hard-coded directional values

---

## 📖 Quick Reference

### Import Paths
```tsx
// Layout
import { ResponsiveContainer, ResponsiveGrid, ResponsiveStack } from '@/components/layout/ResponsiveContainer';

// Forms
import { FloatingInput, FloatingSelect, FloatingTextarea, Checkbox, Radio, FileUpload } from '@/components/ui/FormEnhanced';

// Data Display
import { TableEnhanced, Badge, Column } from '@/components/ui/TableEnhanced';
import { CardEnhanced, CardHeader, CardBody, CardFooter, StatsCard } from '@/components/ui/CardEnhanced';

// Feedback
import { ModalEnhanced, ModalHeader, ModalBody, ModalFooter, ModalButton, ConfirmDialog } from '@/components/ui/ModalEnhanced';
import { useToast, ToastProvider } from '@/components/ui/Toast';
import { Spinner, SkeletonCard, ProgressBar } from '@/components/ui/LoadingStates';

// Mobile
import { MobileActionSheet, ActionItem } from '@/components/ui/MobileActionSheet';

// Hooks
import { useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/useMediaQuery';
import { useSwipe, useLongPress } from '@/hooks/useSwipe';

// Animations
import styles from '@/styles/animations.module.css';
```

---

## 🚀 Getting Started

### 1. Add ToastProvider
```tsx
// app/providers.tsx
import { ToastProvider } from '@/components/ui/Toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider position="top-right">
      {children}
    </ToastProvider>
  );
}
```

### 2. Use Components
```tsx
import { FloatingInput } from '@/components/ui/FormEnhanced';
import { useToast } from '@/components/ui/Toast';

function MyPage() {
  const toast = useToast();
  const [name, setName] = useState('');

  const handleSubmit = () => {
    toast.success('تم الحفظ بنجاح!');
  };

  return (
    <form onSubmit={handleSubmit}>
      <FloatingInput
        label="الاسم"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button type="submit">حفظ</button>
    </form>
  );
}
```

---

## 📝 Notes

- All components support RTL out of the box
- All components are mobile-responsive
- TypeScript types included for all components
- Accessibility features built-in
- Performance optimized with CSS animations
- No external dependencies (except React)

---

**Created with ❤️ for Albassam Tasks Platform**  
**Week 1 Complete - Ready for Production!**
