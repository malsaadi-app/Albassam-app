# أمثلة على استخدام نظام الصلاحيات

## 📚 المحتويات
1. [حماية صفحة كاملة](#حماية-صفحة-كاملة)
2. [إخفاء/إظهار عناصر UI](#إخفاءإظهار-عناصر-ui)
3. [فلترة البيانات حسب الصلاحيات](#فلترة-البيانات-حسب-الصلاحيات)
4. [Sidebar ديناميكي](#sidebar-ديناميكي)
5. [إضافة صلاحية جديدة](#إضافة-صلاحية-جديدة)

---

## 1. حماية صفحة كاملة

### ✅ الطريقة الأولى: Higher-Order Component

```jsx
// app/hr/employees/page.jsx
import { withPermission } from '@/hooks/usePermissions';

function EmployeesPage() {
  return (
    <div>
      <h1>قائمة الموظفين</h1>
      {/* المحتوى */}
    </div>
  );
}

// حماية الصفحة بصلاحية employees.view
export default withPermission(EmployeesPage, 'employees.view');
```

### ✅ الطريقة الثانية: التحقق داخل الـ Component

```jsx
// app/hr/employees/new/page.jsx
import { usePermissions } from '@/hooks/usePermissions';

export default function NewEmployeePage() {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission('employees.create')) {
    return (
      <div className="text-center p-8">
        <p>ليس لديك صلاحية لإضافة موظفين</p>
      </div>
    );
  }
  
  return (
    <div>
      <h1>إضافة موظف جديد</h1>
      {/* Form */}
    </div>
  );
}
```

---

## 2. إخفاء/إظهار عناصر UI

### ✅ إخفاء زر حسب الصلاحية

```jsx
import { PermissionGuard } from '@/hooks/usePermissions';

export default function EmployeesList() {
  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1>قائمة الموظفين</h1>
        
        {/* الزر يظهر فقط إذا كان عنده صلاحية employees.create */}
        <PermissionGuard permission="employees.create">
          <button className="btn-primary">
            ➕ إضافة موظف
          </button>
        </PermissionGuard>
      </div>
      
      {/* القائمة */}
    </div>
  );
}
```

### ✅ عرض محتوى مختلف حسب الصلاحية

```jsx
import { usePermissions } from '@/hooks/usePermissions';

export default function AttendancePage() {
  const { hasPermission, hasAnyPermission } = usePermissions();
  
  return (
    <div>
      <h1>الحضور والانصراف</h1>
      
      {hasPermission('attendance.view') && (
        <div>
          {/* عرض حضور كل الموظفين */}
          <AllEmployeesAttendance />
        </div>
      )}
      
      {hasPermission('attendance.view_team') && !hasPermission('attendance.view') && (
        <div>
          {/* عرض حضور الفريق فقط */}
          <TeamAttendance />
        </div>
      )}
      
      {hasAnyPermission(['attendance.export', 'attendance.manage']) && (
        <div className="mt-4 flex gap-2">
          {hasPermission('attendance.export') && (
            <button>📥 تصدير التقرير</button>
          )}
          {hasPermission('attendance.manage') && (
            <button>✏️ تعديل السجلات</button>
          )}
        </div>
      )}
    </div>
  );
}
```

### ✅ عرض/إخفاء أعمدة جدول

```jsx
import { usePermissions } from '@/hooks/usePermissions';

export default function EmployeesTable({ employees }) {
  const { hasPermission } = usePermissions();
  
  return (
    <table>
      <thead>
        <tr>
          <th>الاسم</th>
          <th>الوظيفة</th>
          {hasPermission('employees.view_salary') && (
            <th>الراتب</th>
          )}
          {hasPermission('employees.edit') && (
            <th>إجراءات</th>
          )}
        </tr>
      </thead>
      <tbody>
        {employees.map(emp => (
          <tr key={emp.id}>
            <td>{emp.name}</td>
            <td>{emp.position}</td>
            {hasPermission('employees.view_salary') && (
              <td>{emp.salary}</td>
            )}
            {hasPermission('employees.edit') && (
              <td>
                <button>✏️ تعديل</button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 3. فلترة البيانات حسب الصلاحيات

### ✅ API Route Protection

```javascript
// app/api/attendance/route.js
import { getServerSession } from 'next-auth';
import { hasPermission, getAccessibleEmployees } from '@/lib/permissions-server';

export async function GET(request) {
  const session = await getServerSession();
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const user = session.user;
  
  // التحقق من الصلاحية
  if (!hasPermission(user, 'attendance.view') && 
      !hasPermission(user, 'attendance.view_team')) {
    return Response.json({ error: 'No permission' }, { status: 403 });
  }
  
  // فلترة البيانات حسب الصلاحية
  let employeeIds;
  
  if (hasPermission(user, 'attendance.view')) {
    // كل الموظفين
    employeeIds = await getAllEmployeeIds();
  } else if (hasPermission(user, 'attendance.view_team')) {
    // موظفي الفريق فقط
    employeeIds = await getAccessibleEmployees(user.id);
  } else {
    // الموظف نفسه فقط
    employeeIds = [user.employeeId];
  }
  
  // جلب البيانات
  const attendance = await prisma.attendance.findMany({
    where: {
      employeeId: { in: employeeIds }
    }
  });
  
  return Response.json(attendance);
}
```

### ✅ Server-Side Helper للفلترة

```javascript
// lib/permissions-server.js
import { prisma } from '@/lib/prisma';

/**
 * احصل على IDs الموظفين المسموح للمستخدم برؤيتهم
 */
export async function getAccessibleEmployees(userId) {
  // جلب org assignments للمستخدم
  const userAssignments = await prisma.orgUnitAssignment.findMany({
    where: {
      employeeId: userId,
      active: true,
      role: { in: ['HEAD', 'SUPERVISOR'] } // فقط المدراء والمشرفين
    },
    select: {
      orgUnitId: true
    }
  });
  
  const unitIds = userAssignments.map(a => a.orgUnitId);
  
  if (unitIds.length === 0) {
    return [userId]; // فقط الموظف نفسه
  }
  
  // جلب كل الموظفين في نفس الوحدات
  const teamAssignments = await prisma.orgUnitAssignment.findMany({
    where: {
      orgUnitId: { in: unitIds },
      active: true
    },
    select: {
      employeeId: true
    }
  });
  
  return [...new Set(teamAssignments.map(a => a.employeeId))];
}

/**
 * التحقق من صلاحية على السيرفر
 */
export function hasPermission(user, permission) {
  if (!user?.permissions) return false;
  if (user.permissions.includes('*')) return true; // SUPER_ADMIN
  return user.permissions.includes(permission);
}
```

---

## 4. Sidebar ديناميكي

### ✅ استخدام Sidebar Component

```jsx
// app/layout.jsx
import DynamicSidebar from '@/components/DynamicSidebar';

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="flex">
          <DynamicSidebar />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
```

الـ Sidebar سيعرض **تلقائياً** فقط الصفحات المسموح بها حسب صلاحيات المستخدم!

---

## 5. إضافة صلاحية جديدة

### 📝 الخطوات:

#### 1. أضف الصلاحية في seed script:

```javascript
// scripts/seed-permissions.js
const PERMISSIONS = [
  // ... الصلاحيات الموجودة
  
  // صلاحية جديدة
  { 
    name: 'reports.view', 
    nameAr: 'عرض التقارير', 
    nameEn: 'View Reports', 
    module: 'reports', 
    description: 'عرض التقارير والإحصائيات' 
  }
];

const ROLE_PERMISSIONS = {
  'DEPT_HEAD': [
    // ... الصلاحيات الموجودة
    'reports.view' // إضافة الصلاحية الجديدة
  ]
};
```

#### 2. أضف الصفحة في navigation config:

```javascript
// lib/navigation-config.js
export const NAVIGATION_CONFIG = [
  // ... العناصر الموجودة
  
  {
    id: 'reports',
    label: 'التقارير',
    labelEn: 'Reports',
    icon: 'BarChart',
    path: '/reports',
    permission: 'reports.view', // الصلاحية المطلوبة
    order: 6
  }
];
```

#### 3. أضف mapping:

```javascript
// lib/navigation-config.js
export const PERMISSION_MODULE_MAP = {
  // ... mappings الموجودة
  
  'reports.view': ['reports']
};
```

#### 4. احمِ الصفحة:

```jsx
// app/reports/page.jsx
import { withPermission } from '@/hooks/usePermissions';

function ReportsPage() {
  return <div>التقارير</div>;
}

export default withPermission(ReportsPage, 'reports.view');
```

#### 5. شغّل seed:

```bash
node scripts/seed-permissions.js
```

**✅ خلاص! الصفحة ستظهر تلقائياً في Sidebar لمن عنده الصلاحية**

---

## 🎯 الخلاصة

### ✅ **ما تحتاج تعمله لكل صلاحية جديدة:**

1. أضف الصلاحية في `scripts/seed-permissions.js`
2. أضف الصفحة في `lib/navigation-config.js`
3. احمِ الصفحة بـ `withPermission` أو `PermissionGuard`
4. شغّل seed

### ❌ **ما تحتاج تعمله:**

- ✅ **لا حاجة** لكتابة كود sidebar جديد
- ✅ **لا حاجة** لـ if statements في كل مكان
- ✅ **لا حاجة** لتعديل الـ routing

**النظام يتولى كل شيء تلقائياً!** 🚀

---

## 💡 نصائح

### Performance Optimization:

```jsx
// استخدم useMemo للبيانات الثقيلة
const { getAccessibleNavigation } = usePermissions();
const navigation = useMemo(() => getAccessibleNavigation, [getAccessibleNavigation]);
```

### Server-Side Rendering:

```jsx
// للصفحات اللي تحتاج SSR
export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res);
  
  if (!hasPermission(session?.user, 'employees.view')) {
    return {
      redirect: {
        destination: '/403',
        permanent: false
      }
    };
  }
  
  return { props: {} };
}
```

### API Route Helpers:

```javascript
// lib/api-helpers.js
export function requirePermission(permission) {
  return async (request) => {
    const session = await getServerSession();
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!hasPermission(session.user, permission)) {
      return Response.json({ error: 'No permission' }, { status: 403 });
    }
    
    return null; // pass
  };
}

// الاستخدام
export async function GET(request) {
  const error = await requirePermission('employees.view')(request);
  if (error) return error;
  
  // المنطق الرئيسي
}
```
