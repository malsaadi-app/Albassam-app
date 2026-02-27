# خطة تطوير نظام إدارة الصيانة
## Albassam Schools App - Maintenance Management Module

---

## 📋 نظرة عامة

### الهدف
إضافة نظام متكامل لإدارة الصيانة يشمل:
1. **صيانة المباني** (Buildings Maintenance)
2. **صيانة الأجهزة الإلكترونية** (Electronics/IT Maintenance)

### الفرق المعنية
- فريق صيانة المباني (Building Maintenance Team)
- فريق صيانة التقنيات (IT/Electronics Maintenance Team)

---

## 🎯 الاحتياجات الأساسية

### 1. إدارة طلبات الصيانة (Maintenance Requests)
- **من يقدم الطلب؟**
  - أي موظف يمكنه تقديم طلب صيانة
  - المديرون يمكنهم تقديم طلبات نيابة عن فرعهم/مرحلتهم
  
- **أنواع الطلبات:**
  - صيانة المباني (مباني، كهرباء، سباكة، تكييف، نجارة، دهانات، إلخ)
  - صيانة الأجهزة (كمبيوترات، طابعات، شاشات، أجهزة عرض، شبكات، إلخ)
  - صيانة طارئة (Emergency)
  - صيانة دورية (Preventive Maintenance)

- **معلومات الطلب:**
  - نوع الصيانة (مبنى / جهاز)
  - الفئة الفرعية (كهرباء، سباكة، كمبيوتر، طابعة، إلخ)
  - الموقع (الفرع + المرحلة + الموقع التفصيلي: فصل، مكتب، قاعة، إلخ)
  - الوصف التفصيلي للمشكلة
  - الأولوية (عادي، عالي، طارئ)
  - الصور (اختياري - لتوضيح المشكلة)
  - رقم الجهاز أو كود الأصل (للأجهزة)

### 2. إدارة الأصول (Assets Management)
**لماذا مهم؟** لتتبع الأجهزة والمعدات وتاريخ صيانتها.

- **سجل الأصول:**
  - الأجهزة الإلكترونية (كمبيوترات، طابعات، شاشات، أجهزة عرض، إلخ)
  - معدات المباني (مكيفات، مولدات، خزانات، إلخ)
  
- **معلومات الأصل:**
  - رقم الأصل / Serial Number
  - النوع / الفئة
  - الموقع (الفرع + المرحلة + الموقع التفصيلي)
  - تاريخ الشراء
  - الضمان (من - إلى)
  - الحالة (جيد، يحتاج صيانة، معطل، خارج الخدمة)
  - تاريخ الصيانة (آخر صيانة + الصيانة القادمة)

### 3. Workflow طلبات الصيانة

```
1. تقديم الطلب (Submitted)
   ↓
2. المراجعة الأولية (Under Review) - مدير الصيانة يراجع الطلب
   ↓
3. التعيين (Assigned) - تعيين الطلب لفني معين
   ↓
4. قيد التنفيذ (In Progress) - الفني بدأ العمل
   ↓
5. منتهي بانتظار التأكيد (Completed - Pending Confirmation)
   ↓
6. مكتمل (Completed) - مقدم الطلب أكد أن المشكلة حُلت
   
أو:
   
6. إعادة فتح (Reopened) - المشكلة لم تُحل بشكل كامل
```

**حالات إضافية:**
- **مؤجل (On Hold)** - في انتظار قطع غيار أو موافقات
- **ملغي (Cancelled)** - إلغاء الطلب
- **مرفوض (Rejected)** - الطلب غير صالح أو خارج النطاق

### 4. الأدوار والصلاحيات

| الدور | الصلاحيات |
|-------|-----------|
| **موظف عادي** | - تقديم طلب صيانة<br>- متابعة طلباته<br>- إضافة تعليقات<br>- تأكيد إتمام الصيانة |
| **مدير صيانة مباني** | - كل صلاحيات الموظف<br>- مراجعة طلبات صيانة المباني<br>- تعيين الفنيين<br>- إغلاق/رفض الطلبات<br>- إدارة فريق صيانة المباني<br>- تقارير صيانة المباني |
| **مدير صيانة تقنيات** | - كل صلاحيات الموظف<br>- مراجعة طلبات صيانة الأجهزة<br>- تعيين الفنيين<br>- إغلاق/رفض الطلبات<br>- إدارة الأصول الإلكترونية<br>- إدارة فريق صيانة التقنيات<br>- تقارير صيانة التقنيات |
| **فني صيانة** | - عرض الطلبات المعينة له<br>- تحديث حالة الطلب<br>- إضافة ملاحظات فنية<br>- طلب قطع غيار<br>- رفع صور للعمل المنجز |
| **Admin/HR** | - عرض كل الطلبات<br>- التقارير الإدارية الشاملة<br>- إدارة الأدوار والصلاحيات |

### 5. النماذج المطلوبة

#### أ) نموذج طلب صيانة جديد
- نوع الصيانة (مبنى / جهاز) → يغير الحقول التالية
- الفئة (dropdown حسب النوع)
- الفرع
- المرحلة (اختياري)
- الموقع التفصيلي (نص حر: فصل 3-أ، مكتب المدير، معمل الحاسب، إلخ)
- الوصف
- الأولوية
- رقم الأصل/الجهاز (للأجهزة)
- رفع صور (اختياري)

#### ب) نموذج تعيين طلب
- اختيار الفني من القائمة (حسب التخصص)
- إضافة ملاحظات للفني
- تحديد الأولوية

#### ج) نموذج تحديث حالة الطلب (للفني)
- الحالة الجديدة
- ملاحظات فنية
- قطع الغيار المستخدمة (اختياري)
- صور للعمل المنجز (اختياري)
- الوقت المستغرق (بالساعات)

#### د) نموذج إضافة أصل جديد
- نوع الأصل
- رقم الأصل / Serial
- الموقع
- تاريخ الشراء
- فترة الضمان
- الحالة

### 6. التقارير المطلوبة

#### تقارير إدارية:
- إجمالي الطلبات (حسب الحالة، النوع، الفرع، الشهر)
- متوسط وقت الاستجابة
- متوسط وقت الإنجاز
- الطلبات المعلقة والمتأخرة
- أكثر الأعطال تكراراً
- أداء الفنيين (عدد الطلبات المنجزة، متوسط الوقت)

#### تقارير الصيانة الدورية:
- الأصول التي تحتاج صيانة دورية قريباً
- الأصول خارج الضمان
- تكلفة الصيانة (قطع غيار + ساعات العمل)

#### تقارير الفروع:
- طلبات الصيانة لكل فرع
- أكثر الفروع طلباً للصيانة

### 7. الميزات الإضافية (Optional - Phase 2)

- **نظام الإشعارات:**
  - إشعار للفني عند تعيين طلب له
  - إشعار لمقدم الطلب عند تحديث الحالة
  - تذكير بالطلبات المتأخرة
  - تذكير بالصيانة الدورية

- **تقييم الخدمة:**
  - مقدم الطلب يقيّم الخدمة (1-5 نجوم) + تعليق

- **جدولة الصيانة الدورية:**
  - تحديد جدول صيانة دورية لكل أصل
  - إنشاء طلبات صيانة دورية تلقائياً

- **إدارة المخزون (قطع الغيار):**
  - سجل قطع الغيار المتوفرة
  - طلب قطع غيار عند النقص
  - ربط قطع الغيار بطلبات الصيانة

---

## 🗃️ قاعدة البيانات المقترحة

### الجداول الجديدة:

#### 1. `MaintenanceRequest` (طلبات الصيانة)
```prisma
model MaintenanceRequest {
  id                 String   @id @default(cuid())
  requestNumber      String   @unique // REQ-2025-0001
  type               String   // BUILDING | ELECTRONICS
  category           String   // كهرباء، سباكة، كمبيوتر، طابعة، إلخ
  priority           String   // NORMAL | HIGH | EMERGENCY
  status             String   // SUBMITTED | UNDER_REVIEW | ASSIGNED | IN_PROGRESS | COMPLETED | CANCELLED | REJECTED | ON_HOLD | REOPENED
  
  // الموقع
  branchId           String
  branch             Branch   @relation(fields: [branchId], references: [id])
  stageId            String?
  stage              Stage?   @relation(fields: [stageId], references: [id])
  locationDetails    String   // الموقع التفصيلي
  
  // الوصف
  description        String
  images             String[] // مصفوفة روابط الصور
  
  // الأصل (للأجهزة)
  assetId            String?
  asset              Asset?   @relation(fields: [assetId], references: [id])
  
  // التعيين
  assignedToId       String?
  assignedTo         Employee? @relation(fields: [assignedToId], references: [id])
  assignedAt         DateTime?
  assignedBy         String?
  
  // مقدم الطلب
  requestedById      String
  requestedBy        Employee @relation(fields: [requestedById], references: [id])
  requestedAt        DateTime @default(now())
  
  // الإنجاز
  completedAt        DateTime?
  completedById      String?
  completedBy        Employee? @relation(fields: [completedById], references: [id])
  
  // التقييم
  rating             Int?     // 1-5
  ratingComment      String?
  
  // التكلفة
  laborHours         Float?   // ساعات العمل
  partsCost          Float?   // تكلفة قطع الغيار
  totalCost          Float?   // التكلفة الإجمالية
  
  // التواريخ
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  
  // العلاقات
  comments           MaintenanceComment[]
  history            MaintenanceHistory[]
  parts              MaintenanceRequestPart[]
}
```

#### 2. `Asset` (الأصول)
```prisma
model Asset {
  id                 String   @id @default(cuid())
  assetNumber        String   @unique // AST-2025-0001
  type               String   // COMPUTER | PRINTER | PROJECTOR | AC | GENERATOR | etc
  category           String   // ELECTRONICS | BUILDING_EQUIPMENT
  name               String
  serialNumber       String?
  
  // الموقع
  branchId           String
  branch             Branch   @relation(fields: [branchId], references: [id])
  stageId            String?
  stage              Stage?   @relation(fields: [stageId], references: [id])
  locationDetails    String
  
  // معلومات الشراء
  purchaseDate       DateTime?
  warrantyStart      DateTime?
  warrantyEnd        DateTime?
  purchasePrice      Float?
  
  // الحالة
  status             String   // GOOD | NEEDS_MAINTENANCE | BROKEN | OUT_OF_SERVICE
  
  // الصيانة
  lastMaintenanceDate DateTime?
  nextMaintenanceDate DateTime?
  maintenanceInterval Int?    // بالأيام
  
  // العلاقات
  maintenanceRequests MaintenanceRequest[]
  maintenanceHistory  MaintenanceHistory[]
  
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

#### 3. `MaintenanceComment` (التعليقات)
```prisma
model MaintenanceComment {
  id                 String   @id @default(cuid())
  requestId          String
  request            MaintenanceRequest @relation(fields: [requestId], references: [id])
  
  userId             String
  user               Employee @relation(fields: [userId], references: [id])
  
  comment            String
  isInternal         Boolean  @default(false) // ملاحظة داخلية (للفنيين فقط)
  
  createdAt          DateTime @default(now())
}
```

#### 4. `MaintenanceHistory` (سجل التغييرات)
```prisma
model MaintenanceHistory {
  id                 String   @id @default(cuid())
  requestId          String?
  request            MaintenanceRequest? @relation(fields: [requestId], references: [id])
  
  assetId            String?
  asset              Asset?   @relation(fields: [assetId], references: [id])
  
  action             String   // STATUS_CHANGED | ASSIGNED | COMPLETED | etc
  oldValue           String?
  newValue           String?
  notes              String?
  
  userId             String
  user               Employee @relation(fields: [userId], references: [id])
  
  createdAt          DateTime @default(now())
}
```

#### 5. `MaintenanceRequestPart` (قطع الغيار المستخدمة)
```prisma
model MaintenanceRequestPart {
  id                 String   @id @default(cuid())
  requestId          String
  request            MaintenanceRequest @relation(fields: [requestId], references: [id])
  
  partName           String
  quantity           Int
  unitCost           Float
  totalCost          Float
  
  createdAt          DateTime @default(now())
}
```

### تعديلات على جداول موجودة:

#### `Employee` - إضافة حقل
```prisma
model Employee {
  // ... الحقول الموجودة
  
  maintenanceRole    String?  // BUILDING_MANAGER | IT_MANAGER | BUILDING_TECH | IT_TECH
  maintenanceTeam    String?  // BUILDING | IT
  
  // العلاقات الجديدة
  maintenanceRequestsCreated  MaintenanceRequest[] @relation("RequestCreator")
  maintenanceRequestsAssigned MaintenanceRequest[] @relation("AssignedTechnician")
  maintenanceRequestsCompleted MaintenanceRequest[] @relation("Completer")
  maintenanceComments         MaintenanceComment[]
  maintenanceHistory          MaintenanceHistory[]
}
```

---

## 📱 الواجهات المطلوبة (Pages)

### 1. صفحة طلبات الصيانة الرئيسية
**المسار:** `/maintenance/requests`

**العرض:**
- قائمة بجميع الطلبات (حسب الصلاحية)
- فلترة: حسب الحالة، النوع، الفرع، الأولوية، التاريخ
- بحث: برقم الطلب، الوصف، مقدم الطلب
- زر: + طلب صيانة جديد
- إحصائيات سريعة (بطاقات):
  - الطلبات الجديدة
  - قيد التنفيذ
  - المكتملة هذا الشهر
  - الطلبات المتأخرة

**لكل طلب:**
- رقم الطلب
- النوع (أيقونة: 🏢 للمباني / 💻 للأجهزة)
- الفئة
- الموقع (الفرع)
- الحالة (badge ملون)
- الأولوية (badge)
- مقدم الطلب
- المعين له (إن وجد)
- التاريخ
- زر: عرض التفاصيل

### 2. صفحة تفاصيل الطلب
**المسار:** `/maintenance/requests/[id]`

**المحتوى:**
- **معلومات الطلب:**
  - رقم الطلب
  - الحالة (مع إمكانية التحديث حسب الصلاحية)
  - النوع والفئة
  - الموقع الكامل
  - الوصف
  - الصور (عرض Gallery)
  - الأولوية
  - مقدم الطلب (مع صورة وبيانات)
  - تاريخ التقديم
  
- **معلومات التعيين:**
  - المعين له (الفني)
  - تاريخ التعيين
  - من قام بالتعيين
  
- **معلومات الإنجاز:**
  - تاريخ الإنجاز
  - ساعات العمل
  - قطع الغيار المستخدمة (جدول)
  - التكلفة الإجمالية
  - التقييم (إن وجد)
  
- **Timeline (سجل التغييرات):**
  - كل تحديث للحالة
  - كل تعيين
  - كل تعليق
  - مع التواريخ والمستخدمين
  
- **قسم التعليقات:**
  - عرض جميع التعليقات
  - إضافة تعليق جديد
  - تمييز التعليقات الداخلية (للفنيين فقط)
  
- **أزرار الإجراءات (حسب الصلاحية):**
  - تعيين لفني
  - تحديث الحالة
  - إضافة قطع غيار
  - إلغاء الطلب
  - إعادة فتح
  - تحميل PDF

### 3. صفحة طلب صيانة جديد
**المسار:** `/maintenance/requests/new`

**نموذج:**
- نوع الصيانة (radio buttons: مبنى / جهاز)
- الفئة (dropdown يتغير حسب النوع)
- الفرع (dropdown)
- المرحلة (dropdown - اختياري)
- الموقع التفصيلي (text)
- الوصف (textarea)
- الأولوية (dropdown)
- رقم الأصل (للأجهزة - autocomplete)
- رفع صور (file upload - multiple)
- زر: إرسال الطلب

### 4. صفحة الأصول
**المسار:** `/maintenance/assets`

**العرض:**
- قائمة بجميع الأصول
- فلترة: حسب النوع، الفرع، الحالة، الضمان
- بحث: برقم الأصل، Serial Number
- زر: + إضافة أصل جديد
- إحصائيات:
  - إجمالي الأصول
  - الأصول التي تحتاج صيانة
  - الأصول خارج الضمان
  - الصيانة الدورية القادمة

**لكل أصل:**
- رقم الأصل
- النوع
- الموقع
- الحالة (badge)
- آخر صيانة
- الصيانة القادمة
- زر: عرض التفاصيل

### 5. صفحة تفاصيل الأصل
**المسار:** `/maintenance/assets/[id]`

**المحتوى:**
- معلومات الأصل الأساسية
- سجل الصيانة (جميع طلبات الصيانة المرتبطة)
- جدول الصيانة الدورية
- التكلفة الإجمالية للصيانة
- Timeline
- أزرار: تعديل | طلب صيانة | حذف

### 6. صفحة التقارير
**المسار:** `/maintenance/reports`

**الأقسام:**
- تقرير الطلبات حسب الحالة (Charts)
- تقرير الطلبات حسب الفرع
- تقرير أداء الفنيين
- تقرير التكاليف
- تقرير أكثر الأعطال تكراراً
- الصيانة الدورية القادمة
- تصدير التقارير (Excel / PDF)

### 7. Dashboard الصيانة
**المسار:** `/maintenance` أو `/maintenance/dashboard`

**العرض:**
- بطاقات إحصائية (KPIs):
  - الطلبات الجديدة
  - قيد التنفيذ
  - المكتملة هذا الشهر
  - الطلبات المتأخرة (متأخرة عن SLA)
  - متوسط وقت الاستجابة
  - متوسط وقت الإنجاز
  
- Charts:
  - الطلبات حسب الأسبوع/الشهر (Line chart)
  - توزيع الطلبات حسب النوع (Pie chart)
  - الطلبات حسب الفرع (Bar chart)
  
- طلبات تحتاج إجراء:
  - طلبات جديدة (للمديرين)
  - طلبات معينة لي (للفنيين)
  - طلبات بانتظار التأكيد (لمقدمي الطلبات)
  
- آخر الأنشطة (Timeline)

---

## 🔄 مراحل التنفيذ المقترحة

### المرحلة 1: البنية الأساسية (Core) ⭐ أولوية
**المدة المقدرة:** 3-5 أيام

- ✅ إنشاء Database Schema
- ✅ إنشاء API Routes للطلبات
- ✅ صفحة قائمة الطلبات
- ✅ صفحة تفاصيل الطلب
- ✅ صفحة طلب جديد
- ✅ Workflow أساسي (Submit → Assign → In Progress → Complete)
- ✅ صلاحيات أساسية
- ✅ التعليقات
- ✅ Timeline

### المرحلة 2: إدارة الأصول
**المدة المقدرة:** 2-3 أيام

- ✅ Database للأصول
- ✅ صفحة قائمة الأصول
- ✅ صفحة تفاصيل الأصل
- ✅ صفحة إضافة/تعديل أصل
- ✅ ربط الأصول بالطلبات

### المرحلة 3: التقارير والإحصائيات
**المدة المقدرة:** 2-3 أيام

- ✅ Dashboard الصيانة
- ✅ صفحة التقارير
- ✅ Charts والإحصائيات
- ✅ تصدير التقارير

### المرحلة 4: ميزات متقدمة (Optional)
**المدة المقدرة:** 3-4 أيام

- ⏳ نظام الإشعارات
- ⏳ تقييم الخدمة
- ⏳ الصيانة الدورية التلقائية
- ⏳ إدارة المخزون (قطع الغيار)

---

## 💰 التكلفة التقديرية (وقت التطوير)

| المرحلة | الوقت المقدر | الأولوية |
|---------|---------------|----------|
| المرحلة 1: البنية الأساسية | 3-5 أيام | 🔴 حرجة |
| المرحلة 2: إدارة الأصول | 2-3 أيام | 🟡 عالية |
| المرحلة 3: التقارير | 2-3 أيام | 🟡 عالية |
| المرحلة 4: ميزات متقدمة | 3-4 أيام | 🟢 متوسطة |
| **الإجمالي** | **10-15 يوم عمل** | |

---

## 🎨 UI/UX ملاحظات

- استخدام نفس نظام التصميم الحالي
- أيقونات واضحة: 🏢 للمباني، 💻 للأجهزة
- ألوان الحالات:
  - جديد: أزرق
  - قيد المراجعة: برتقالي
  - معين: أزرق فاتح
  - قيد التنفيذ: أصفر
  - مكتمل: أخضر
  - ملغي/مرفوض: رمادي
  - طارئ: أحمر (لوسم الأولوية)
  
- Responsive design للجوال (محمد يستخدم الجوال كثيراً)
- رفع الصور: سهل وواضح

---

## ✅ متطلبات للبدء

قبل البدء بالتطوير، نحتاج تأكيد:

1. **هل الفئات المقترحة مناسبة؟**
   - صيانة المباني: كهرباء، سباكة، تكييف، نجارة، دهانات، أخرى
   - صيانة الأجهزة: كمبيوتر، طابعة، شاشة، جهاز عرض، شبكات، أخرى
   
2. **هل تريد إضافة فئات أخرى؟**

3. **هل هناك أدوار إضافية؟**
   - مثلاً: مشرف صيانة، منسق صيانة، إلخ؟

4. **هل تريد البدء بالمرحلة 1 فقط أو جميع المراحل دفعة واحدة؟**

5. **هل هناك متطلبات خاصة لم نذكرها؟**

---

## 📝 ملاحظات إضافية

- النظام مصمم ليكون مرن وقابل للتوسع
- يمكن إضافة فئات جديدة بسهولة دون تعديل الكود
- التصميم يدعم أي عدد من الفنيين والفرق
- يمكن ربطه لاحقاً مع نظام المشتريات (لطلب قطع الغيار)
- يمكن ربطه مع نظام الموارد البشرية (تقييم أداء الفنيين)

---

## 🚀 الخطوة القادمة

إذا وافقت على الخطة، سأبدأ بـ:
1. إنشاء Database Schema
2. تطبيق المرحلة 1 (البنية الأساسية)
3. اختبار شامل
4. عرض النتيجة عليك

**هل أنت موافق على الخطة؟ هل تريد تعديل أو إضافة شيء؟** 🤔
