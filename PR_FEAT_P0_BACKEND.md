PR: feat(p0): backend verifications — leave balance, procurement totals, attendance late-summary API

ملخص:
- إضافة تحقق رصيد الإجازات قبل قبول الطلب (transactional, SELECT FOR UPDATE).
- إضافة تحقق مجموع بنود المشتريات على السيرفر ومقارنة بالـtotal المعلن.
- إضافة جدول بسيط leave_balances + attendance is_late/late_minutes migrations (SQL stubs في albassam-tasks/migrations).
- إضافة endpoint: GET /api/attendance/late-summary

ملفّات مبدئية للتعديل:
- src/services/leaveService.ts
- src/controllers/leaveController.ts
- src/services/procurementService.ts
- src/controllers/procurementController.ts
- src/services/attendanceService.ts
- src/controllers/attendanceController.ts
- db/migrations/20260304_create_leave_balances.sql
- db/migrations/20260304_add_late_fields_attendance.sql

اختبارات مقترحة مذكورة في albassam-tasks/ (unit + integration)
