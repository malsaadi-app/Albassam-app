# ⚡ Quick Start Guide

**Get started with Enhanced UI Components in 5 minutes!**

---

## 🚀 Installation

Components are already installed! Just import and use.

---

## 📦 Most Used Components

### 1️⃣ Forms (FloatingInput)
```tsx
import { FloatingInput } from '@/components/ui/FormEnhanced';

<FloatingInput
  label="البريد الإلكتروني"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={error}
  clearable
/>
```

### 2️⃣ Table (TableEnhanced)
```tsx
import { TableEnhanced } from '@/components/ui/TableEnhanced';

<TableEnhanced
  data={users}
  columns={[
    { key: 'name', label: 'الاسم', sortable: true },
    { key: 'email', label: 'البريد', sortable: true },
  ]}
  selectable
  searchable
/>
```

### 3️⃣ Toast Notifications
```tsx
// 1. Add Provider (in app/providers.tsx)
import { ToastProvider } from '@/components/ui/Toast';

<ToastProvider position="top-right">
  {children}
</ToastProvider>

// 2. Use in component
import { useToast } from '@/components/ui/Toast';

const toast = useToast();
toast.success('تم الحفظ بنجاح!');
toast.error('حدث خطأ!');
```

### 4️⃣ Cards
```tsx
import { StatsCard } from '@/components/ui/CardEnhanced';

<StatsCard
  label="المستخدمين"
  value="1,234"
  change={{ value: '+12%', isPositive: true }}
  variant="gradient"
/>
```

### 5️⃣ Modal
```tsx
import { ModalEnhanced, ModalHeader, ModalBody, ModalFooter, ModalButton } from '@/components/ui/ModalEnhanced';

<ModalEnhanced isOpen={isOpen} onClose={() => setIsOpen(false)}>
  <ModalHeader title="العنوان" />
  <ModalBody>المحتوى</ModalBody>
  <ModalFooter>
    <ModalButton onClick={() => setIsOpen(false)}>إغلاق</ModalButton>
    <ModalButton variant="primary">حفظ</ModalButton>
  </ModalFooter>
</ModalEnhanced>
```

### 6️⃣ Loading States
```tsx
import { Spinner, SkeletonCard } from '@/components/ui/LoadingStates';

{loading ? <Spinner /> : <Content />}
{loading ? <SkeletonCard /> : <Card />}
```

### 7️⃣ Responsive Hooks
```tsx
import { useIsMobile } from '@/hooks/useMediaQuery';

const isMobile = useIsMobile();

{isMobile ? <MobileView /> : <DesktopView />}
```

---

## 🎨 Animation Classes
```tsx
import styles from '@/styles/animations.module.css';

<div className={styles.fadeInUp}>Animated!</div>
<div className={styles.hoverLift}>Lift on hover</div>
```

---

## 📱 Mobile Components
```tsx
import { MobileActionSheet, ActionItem } from '@/components/ui/MobileActionSheet';

<MobileActionSheet isOpen={isOpen} onClose={close} title="الإجراءات">
  <ActionItem title="عرض" onClick={() => {}} />
  <ActionItem title="حذف" onClick={() => {}} danger />
</MobileActionSheet>
```

---

## 🎯 Common Patterns

### Form with Validation
```tsx
const [name, setName] = useState('');
const [nameError, setNameError] = useState('');

const validate = () => {
  if (name.length < 3) {
    setNameError('الاسم قصير جداً');
    return false;
  }
  setNameError('');
  return true;
};

<FloatingInput
  label="الاسم"
  value={name}
  onChange={(e) => setName(e.target.value)}
  onBlur={validate}
  error={nameError}
/>
```

### Confirm Delete
```tsx
import { ConfirmDialog } from '@/components/ui/ModalEnhanced';

<ConfirmDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleDelete}
  title="تأكيد الحذف"
  message="هل أنت متأكد؟"
  variant="danger"
/>
```

### Responsive Grid
```tsx
import { ResponsiveGrid } from '@/components/layout/ResponsiveContainer';

<ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 4 }}>
  <StatsCard />
  <StatsCard />
  <StatsCard />
  <StatsCard />
</ResponsiveGrid>
```

---

## ✅ Checklist for New Pages

- [ ] Use `ResponsiveContainer` for max-width
- [ ] Add `ToastProvider` if using toasts
- [ ] Use `FloatingInput` instead of plain inputs
- [ ] Use `TableEnhanced` for data tables
- [ ] Add loading states with `Spinner` or `Skeleton`
- [ ] Use `ModalEnhanced` for dialogs
- [ ] Test on mobile with `useIsMobile()`
- [ ] Add animations with CSS classes
- [ ] Ensure RTL support (`dir="rtl"`)

---

## 🔗 More Info

See [COMPONENTS.md](./COMPONENTS.md) for full documentation.

---

**Happy Coding! 🚀**
