# Changelog - Albassam Schools App

## Version 2.0.0 - 12 Feb 2026

### 🆕 ميزات جديدة

#### 1. إضافة ملفات للمهام 📎
- ✅ إضافة حقل `attachments` في جدول Task (JSON array)
- ✅ API endpoint لرفع الملفات: `POST /api/tasks/[id]/attachments`
- ✅ API endpoint لتحميل الملفات: `GET /api/tasks/[id]/attachments/download`
- ✅ API endpoint لحذف الملفات: `DELETE /api/tasks/[id]/attachments`
- ✅ حفظ الملفات في: `/data/.openclaw/workspace/albassam-tasks/uploads/`
- ✅ عرض الملفات في بطاقة المهمة مع زر رفع/تحميل/حذف
- ✅ حد أقصى: 10MB للملف
- ✅ أنواع مسموحة: PDF, Word, Excel, Images, ZIP
- ✅ عرض معلومات الملف (الحجم، من رفعه، التاريخ)
- ✅ أيقونات مميزة لكل نوع ملف

#### 2. تغيير كلمات المرور 🔐
- ✅ صفحة جديدة: `/profile`
- ✅ Form لتغيير كلمة المرور: كلمة المرور القديمة + الجديدة + تأكيد
- ✅ API: `POST /api/auth/change-password`
- ✅ Validation: min 8 أحرف
- ✅ رابط في الهيدر: "⚙️ الملف الشخصي"
- ✅ عرض معلومات الحساب (اسم المستخدم، الاسم، الدور)
- ✅ إعدادات Telegram في نفس الصفحة

#### 3. تقارير وإحصائيات 📊
- ✅ صفحة جديدة: `/reports` (للمدير فقط)
- ✅ إحصائيات شاملة:
  - عدد المهام لكل موظف (جدول تفصيلي)
  - مخطط بياني (Bar Chart) لعدد المهام حسب الحالة لكل موظف
  - مخطط دائري (Pie Chart) لتوزيع المهام حسب القسم
  - معدل الإنجاز (completed/total) لكل موظف
  - المهام المتأخرة (بانتظار لأكثر من 7 أيام)
- ✅ تقرير بالفترة (date range filter)
- ✅ Export CSV/Excel للبيانات
- ✅ بطاقات إحصائية ملونة (إجمالي، مكتملة، قيد التنفيذ، متأخرة، معدل الإنجاز)
- ✅ قائمة المهام المتأخرة مع تنبيه مرئي

#### 4. إشعارات Telegram 🔔
- ✅ عند إحالة مهمة لموظف → إشعار Telegram للموظف
- ✅ عند تغيير حالة المهمة من قبل الموظف → إشعار للمدير
- ✅ استخدام `message` tool للإرسال (جاهز للتكامل)
- ✅ إضافة حقل `telegramId` في جدول User (nullable)
- ✅ إضافة حقل `notificationsEnabled` في جدول User
- ✅ تفعيل/تعطيل الإشعارات في Profile
- ✅ Helper functions في `lib/telegram.ts` للإشعارات
- ✅ دمج الإشعارات في API endpoints

### 🔧 تحسينات تقنية
- ✅ تحديث Prisma Schema بالحقول الجديدة
- ✅ إضافة component `TaskAttachments.tsx` قابلة لإعادة الاستخدام
- ✅ تثبيت dependencies جديدة:
  - `chart.js` و `react-chartjs-2` للمخططات البيانية
  - `bcrypt` و `@types/bcrypt` لتشفير كلمات المرور
- ✅ TypeScript strict mode compliance
- ✅ احتفاظ كامل بالتصميم الحالي (glassmorphism + ألوان البراند)
- ✅ استخدام inline styles للاتساق
- ✅ Responsive design لجميع الصفحات الجديدة

### 📱 تحسينات واجهة المستخدم
- ✅ زر "التقارير" في الهيدر (للمدير فقط)
- ✅ زر "الملف الشخصي" في الهيدر (لجميع المستخدمين)
- ✅ رسوم متحركة (animations) سلسة
- ✅ رسائل نجاح/خطأ واضحة
- ✅ تجربة مستخدم محسّنة للملفات المرفقة

### 🗄️ قاعدة البيانات
- ✅ Migration نجح بدون مشاكل
- ✅ الحقول الجديدة:
  - `Task.attachments` (String, nullable) - JSON array
  - `User.telegramId` (String, nullable)
  - `User.notificationsEnabled` (Boolean, default: true)

### 🚀 الإنتاج
- ✅ Build نجح بدون أخطاء
- ✅ جميع الصفحات تم تجميعها بنجاح
- ✅ مجلد `uploads/` تم إنشاؤه

### 📝 ملاحظات
- إشعارات Telegram جاهزة للتكامل مع OpenClaw message tool
- يمكن للمدير تعيين Telegram ID الخاص به في صفحة Profile
- التطبيق deployed على: https://app.albassam-app.com
- Cloudflare Tunnel يعمل في background (session cool-sable)

### 🔐 Credentials
- **Admin:** Mohammed / abcde12345
- **Telegram ID (Mohammed):** 845495401

---

**مطور:** OpenClaw AI Agent  
**التاريخ:** 12 فبراير 2026  
**الإصدار:** 2.0.0
