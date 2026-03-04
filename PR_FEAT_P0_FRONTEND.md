PR: feat(p0): procurement line-items UI + leave balance widget + attachments placeholder

ملخص:
- إضافة مكوّن LineItemsForm مع صفوف قابلة للإضافة/الحذف وتحديث المجموعات آنيًا.
- إضافة LeaveBalanceWidget لعرض أرصدة الإجازات في صفحة إنشاء الإجازة.
- إضافة LeaveAttachments كمكوّن مؤقت (queue) لرفع الملفات لاحقًا.

قائمة الملفات المقترحة:
- src/components/Procurement/LineItemsForm.(tsx|vue)
- src/components/Procurement/LineItemRow.(tsx|vue)
- src/components/Procurement/LineItemsSummary.(tsx|vue)
- src/pages/Procurement/NewRequest.(tsx|vue)
- src/components/HR/LeaveRequestForm.(tsx|vue)
- src/components/HR/LeaveBalanceWidget.(tsx|vue)
- src/components/HR/LeaveAttachments.(tsx|vue)

تعليمات اختبار سريعة (QA):
1) شغّل seed scripts: node albassam-tasks/seed-simple-requests.js
2) شغّل Playwright spec: npx playwright test tests/e2e/procurement.spec.ts

ملاحظات:
- الكود الحالي يحتاج تكييف حسب إطار المشروع (Vue/React). الملف أعلاه مبدئي.
