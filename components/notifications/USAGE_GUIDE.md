# Notifications System Usage Guide

## 📚 نظرة عامة

نظام notifications متكامل يتضمن:
- **Toast Notifications** - إشعارات منبثقة مؤقتة
- **Notification Center** - مركز الإشعارات داخل التطبيق
- **Push Notifications** - إشعارات PWA (اختياري)
- **Email Notifications** - تكامل مع البريد الإلكتروني (جاهز)

---

## 🍞 Toast Notifications

### Setup في Root Layout

```tsx
// app/layout.tsx
import { ToastProvider } from '@/components/notifications';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
```

### استخدام useToast Hook

```tsx
'use client';

import { useToast } from '@/components/notifications';

export default function MyComponent() {
  const toast = useToast();

  // Success toast
  toast.success('تم الحفظ بنجاح');
  toast.success('تم الحفظ بنجاح', 'عملية ناجحة');

  // Error toast
  toast.error('فشل الحفظ');
  toast.error('فشل الحفظ', 'خطأ');

  // Warning toast
  toast.warning('تحذير: البيانات قديمة');

  // Info toast
  toast.info('معلومة: يوجد تحديث جديد');

  // Custom toast with action
  toast.addToast({
    type: 'success',
    title: 'تم رفع الملف',
    message: 'تم رفع الملف بنجاح',
    duration: 5000,
    action: {
      label: 'عرض',
      onClick: () => console.log('View clicked'),
    },
  });

  return <button onClick={() => toast.success('تم!')}>حفظ</button>;
}
```

### أمثلة عملية

#### 1. Form Submit

```tsx
async function handleSubmit(data) {
  const toast = useToast();

  try {
    await fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    toast.success('تم الحفظ بنجاح');
  } catch (error) {
    toast.error('فشل الحفظ. يرجى المحاولة مرة أخرى');
  }
}
```

#### 2. Delete Confirmation

```tsx
async function handleDelete(id) {
  const toast = useToast();

  try {
    await fetch(`/api/items/${id}`, { method: 'DELETE' });

    toast.addToast({
      type: 'success',
      message: 'تم الحذف بنجاح',
      duration: 5000,
      action: {
        label: 'تراجع',
        onClick: async () => {
          await undoDelete(id);
          toast.success('تم التراجع');
        },
      },
    });
  } catch (error) {
    toast.error('فشل الحذف');
  }
}
```

#### 3. File Upload Progress

```tsx
async function uploadFile(file) {
  const toast = useToast();

  toast.info('جاري رفع الملف...');

  try {
    await upload(file);
    toast.success('تم رفع الملف بنجاح', 'تم');
  } catch (error) {
    toast.error('فشل رفع الملف', 'خطأ');
  }
}
```

---

## 🔔 Notification Center

### إضافة Notification Bell في Navbar

```tsx
// components/Navbar.tsx
import { NotificationBell } from '@/components/notifications';

export default function Navbar() {
  return (
    <nav>
      <div className="flex items-center gap-4">
        {/* Other nav items */}
        <NotificationBell />
      </div>
    </nav>
  );
}
```

### إنشاء Notification من الـ Backend

```tsx
// Server action or API route
import { createNotification, NotificationTemplates } from '@/lib/notifications';

// Method 1: Using templates
await createNotification({
  userId: 'user-123',
  ...NotificationTemplates.taskAssigned('Task Title', 'Ahmed', 'task-456'),
});

// Method 2: Custom notification
await createNotification({
  userId: 'user-123',
  type: 'task',
  title: 'مهمة جديدة',
  message: 'تم تعيين مهمة جديدة لك',
  actionUrl: '/tasks/123',
  actionLabel: 'عرض المهمة',
  metadata: {
    taskId: '123',
    assignerId: 'user-456',
  },
});

// Method 3: Bulk notifications
await createBulkNotifications(
  ['user-1', 'user-2', 'user-3'],
  {
    type: 'system',
    title: 'صيانة مجدولة',
    message: 'سيكون النظام متوقفاً للصيانة غداً',
  }
);
```

### Notification Templates المتوفرة

```tsx
import { NotificationTemplates } from '@/lib/notifications';

// Tasks
NotificationTemplates.taskAssigned(taskTitle, assignerName, taskId);
NotificationTemplates.taskDueSoon(taskTitle, dueDate, taskId);
NotificationTemplates.taskCompleted(taskTitle, completedBy);

// Leave
NotificationTemplates.leaveApproved(leaveType, startDate, leaveId);
NotificationTemplates.leaveRejected(leaveType, reason?);
NotificationTemplates.leaveRequestPending(employeeName, leaveType, leaveId);

// Attendance
NotificationTemplates.attendanceMissed(date);
NotificationTemplates.attendanceLate(date, minutesLate);

// Purchase
NotificationTemplates.purchaseApproved(requestTitle, requestId);
NotificationTemplates.purchaseRejected(requestTitle, reason?);

// System
NotificationTemplates.systemUpdate(version);
NotificationTemplates.systemMaintenance(startTime, duration);

// Mentions
NotificationTemplates.mentioned(authorName, context, url);
```

### Database Schema Required

```prisma
// prisma/schema.prisma

model Notification {
  id          String   @id @default(cuid())
  userId      String
  type        String   // task, leave, attendance, purchase, system, mention
  title       String
  message     String
  read        Boolean  @default(false)
  actionUrl   String?
  actionLabel String?
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, read])
  @@index([createdAt])
}

model PushSubscription {
  id           String   @id @default(cuid())
  userId       String
  endpoint     String
  subscription String   // JSON string
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, endpoint])
  @@index([userId])
}
```

---

## 📱 Push Notifications (PWA)

### 1. Generate VAPID Keys

```bash
# Install web-push
npm install web-push

# Generate keys
npx web-push generate-vapid-keys

# Add to .env
VAPID_PUBLIC_KEY=xxx
VAPID_PRIVATE_KEY=xxx
```

### 2. Service Worker Setup

```js
// public/sw.js

self.addEventListener('push', (event) => {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-72x72.png',
    data: data.data,
    actions: data.data?.url ? [
      { action: 'open', title: 'فتح' },
      { action: 'close', title: 'إغلاق' },
    ] : undefined,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});
```

### 3. Subscribe to Push in Client

```tsx
'use client';

import { useEffect } from 'react';

export function usePushNotifications() {
  useEffect(() => {
    async function subscribe() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications not supported');
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          // Subscribe
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
            ),
          });

          // Send subscription to server
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription),
          });

          console.log('Push subscription successful');
        }
      } catch (error) {
        console.error('Failed to subscribe to push:', error);
      }
    }

    subscribe();
  }, []);
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
```

### 4. API Route للاشتراك

```tsx
// app/api/push/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { subscribeToPush } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subscription = await req.json();

  await subscribeToPush(session.user.id, subscription);

  return NextResponse.json({ success: true });
}
```

---

## 📧 Email Notifications

### تكامل مع Notification System

```tsx
// lib/email.ts
import { sendEmail } from './your-email-service';

export async function sendNotificationEmail(
  userEmail: string,
  notification: {
    title: string;
    message: string;
    actionUrl?: string;
  }
) {
  const html = `
    <h2>${notification.title}</h2>
    <p>${notification.message}</p>
    ${notification.actionUrl ? `
      <a href="${process.env.APP_URL}${notification.actionUrl}" 
         style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px;">
        عرض التفاصيل
      </a>
    ` : ''}
  `;

  await sendEmail({
    to: userEmail,
    subject: notification.title,
    html,
  });
}
```

### استخدام

```tsx
import { createNotification } from '@/lib/notifications';
import { sendNotificationEmail } from '@/lib/email';

// Create in-app notification
await createNotification({
  userId: user.id,
  ...NotificationTemplates.taskAssigned('Task', 'Ahmed', 'task-123'),
});

// Send email notification (optional)
if (user.emailNotifications) {
  await sendNotificationEmail(user.email, {
    title: 'مهمة جديدة',
    message: 'تم تعيين مهمة جديدة لك',
    actionUrl: '/tasks/task-123',
  });
}
```

---

## 🎯 أمثلة عملية كاملة

### Example 1: Task Assignment Flow

```tsx
// Server action
'use server';

import { createNotification, NotificationTemplates } from '@/lib/notifications';
import { sendNotificationEmail } from '@/lib/email';

export async function assignTask(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const currentUser = await getCurrentUser();

  // Create notification
  await createNotification({
    userId,
    ...NotificationTemplates.taskAssigned(
      task.title,
      currentUser.name,
      taskId
    ),
  });

  // Send email if enabled
  if (user.emailNotifications) {
    await sendNotificationEmail(user.email, {
      title: 'مهمة جديدة',
      message: `تم تعيين مهمة "${task.title}" لك`,
      actionUrl: `/tasks/${taskId}`,
    });
  }

  return { success: true };
}
```

```tsx
// Client component
'use client';

import { useToast } from '@/components/notifications';
import { assignTask } from './actions';

export default function AssignButton({ taskId, userId }) {
  const toast = useToast();

  async function handleAssign() {
    try {
      await assignTask(taskId, userId);
      toast.success('تم تعيين المهمة بنجاح');
    } catch (error) {
      toast.error('فشل تعيين المهمة');
    }
  }

  return <button onClick={handleAssign}>تعيين</button>;
}
```

### Example 2: Leave Approval Workflow

```tsx
// Server action
export async function approveLeave(leaveId: string) {
  const leave = await prisma.leave.update({
    where: { id: leaveId },
    data: { status: 'approved' },
    include: { employee: true },
  });

  // Notify employee
  await createNotification({
    userId: leave.employeeId,
    ...NotificationTemplates.leaveApproved(
      leave.type,
      leave.startDate.toLocaleDateString('ar-SA'),
      leaveId
    ),
  });

  return { success: true };
}
```

```tsx
// Client component
'use client';

import { useToast } from '@/components/notifications';

export default function ApproveButton({ leaveId }) {
  const toast = useToast();

  async function handleApprove() {
    try {
      await approveLeave(leaveId);
      toast.success('تمت الموافقة على الإجازة');
    } catch (error) {
      toast.error('فشلت الموافقة');
    }
  }

  return <button onClick={handleApprove}>موافقة</button>;
}
```

### Example 3: System Maintenance Announcement

```tsx
// Admin action
export async function announceSystemMaintenance(startTime: string, duration: string) {
  // Get all users
  const users = await prisma.user.findMany({ select: { id: true, email: true } });

  // Create bulk notifications
  await createBulkNotifications(
    users.map((u) => u.id),
    NotificationTemplates.systemMaintenance(startTime, duration)
  );

  // Send emails
  for (const user of users) {
    await sendNotificationEmail(user.email, {
      title: 'صيانة مجدولة',
      message: `سيكون النظام متوقفاً للصيانة في ${startTime} لمدة ${duration}`,
    });
  }

  return { success: true };
}
```

---

## 🧹 Cleanup & Maintenance

### Scheduled Cleanup Job (Cron)

```tsx
// scripts/cleanup-notifications.ts
import { deleteOldNotifications } from '@/lib/notifications';

async function cleanupOldNotifications() {
  const result = await deleteOldNotifications(30); // Delete read notifications older than 30 days
  console.log(`Deleted ${result.count} old notifications`);
}

cleanupOldNotifications();
```

### Add to Cron Schedule

```bash
# Run daily at 2 AM
0 2 * * * node scripts/cleanup-notifications.ts
```

---

## 📊 Analytics & Monitoring

### Track Notification Metrics

```tsx
// lib/notification-analytics.ts

export async function getNotificationStats(userId: string) {
  const stats = await prisma.notification.groupBy({
    by: ['type', 'read'],
    where: { userId },
    _count: true,
  });

  return {
    total: stats.reduce((sum, s) => sum + s._count, 0),
    unread: stats.filter((s) => !s.read).reduce((sum, s) => sum + s._count, 0),
    byType: stats.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + s._count;
      return acc;
    }, {} as Record<string, number>),
  };
}
```

---

## ✅ Best Practices

### 1. Toast Usage

- ✅ **Success:** للعمليات الناجحة (حفظ، حذف، إضافة)
- ✅ **Error:** للأخطاء القابلة للإصلاح
- ✅ **Warning:** للتحذيرات (بيانات قديمة، جلسة منتهية قريباً)
- ✅ **Info:** للمعلومات العامة (تحديث متوفر)
- ❌ لا تستخدم toast للـ critical errors (استخدم error page)

### 2. Notification Center

- ✅ استخدم templates جاهزة
- ✅ أضف actionUrl متى أمكن
- ✅ اجعل الرسائل واضحة ومختصرة
- ✅ قم بتنظيف الإشعارات القديمة
- ❌ لا ترسل spam notifications

### 3. Push Notifications

- ✅ اطلب إذن المستخدم بوضوح
- ✅ استخدم للإشعارات المهمة فقط
- ✅ احترم تفضيلات المستخدم
- ❌ لا ترسل notifications متكررة

### 4. Email Notifications

- ✅ اجعلها اختيارية (user preference)
- ✅ استخدم templates احترافية
- ✅ أضف unsubscribe link
- ❌ لا ترسل emails متكررة

---

## 🎯 Checklist للتطبيق

- [ ] ToastProvider في Root Layout
- [ ] NotificationBell في Navbar
- [ ] Database schema (Notification + PushSubscription)
- [ ] Notification templates محددة للتطبيق
- [ ] Push notifications setup (VAPID keys)
- [ ] Service worker registered
- [ ] Email notifications integration
- [ ] Cleanup cron job
- [ ] User notification preferences

---

**Status:** ✅ Ready to use
**Components:** 3 main components + templates
**Size:** ~30 KB
**Features:** Toast, In-app, Push (PWA), Email-ready
