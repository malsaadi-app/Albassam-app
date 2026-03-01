# Albassam Platform — Launch Execution Checklist (Concise)

> هدف القائمة: تجهيز النظام 100% للإطلاق التجريبي ثم التوسع لـ 600 مستخدم + تجهيز مسار المتاجر.

**Legend:**
- [ ] Not done
- [x] Done
- **P0** = لازم قبل الـ Pilot
- **P1** = لازم قبل التوسع (600)
- **P2** = تحسينات ما بعد الإطلاق

---

## 0) Freeze & inventory (P0)
- [ ] تحديد تاريخ **Pilot start** + **Go/No-Go**
- [ ] تثبيت Scope الـ Pilot (وش الموديولات الداخلة بالتجربة أول أسبوعين)
- [ ] تجهيز حسابات التجربة + الفروع المشاركة + مسؤول التواصل
- [ ] توثيق Permission Matrix (Roles/Permissions × Modules × Actions)

---

## 1) Security & Data Protection (P0)
### 1.1 Uploads & attachments (CRITICAL)
- [ ] **إقفال `/api/upload`**: منع أي رفع بدون تسجيل دخول
- [ ] ربط الرفع بصلاحية واضحة (مثال: `files.upload` / `hr.requests.attachments.write`)
- [ ] منع حفظ الملفات في `public/uploads` بشكل عام (تحويلها لتخزين خاص + endpoint تنزيل يتحقق من الصلاحيات)
- [ ] File validation:
  - [ ] whitelist للامتدادات/MIME
  - [ ] حد الحجم + حد عدد الملفات
  - [ ] filenames safe
- [ ] Audit log لأي رفع/تحميل/حذف

### 1.2 Auth / Session
- [ ] التأكد من `SESSION_PASSWORD` قوي ومختلف بين prod/staging
- [ ] سياسة كلمة مرور للإنتاج (حد أدنى + منع كلمات شائعة)
- [ ] Rate limiting:
  - [ ] login ✅ (موجود) — مراجعة اعتمادها على IP من Cloudflare headers
  - [ ] endpoints حساسة إضافية (إنشاء مستخدم/إعادة تعيين/موافقات) باستخدام strictLimiter
- [ ] فحص CSRF (لأن الجلسة cookie-based) وتحديد الحل المعتمد (token/header)

### 1.3 RBAC enforcement
- [ ] جرد **Top endpoints الحساسة** والتأكد إنها تتحقق من permissions في السيرفر (مو UI)
- [ ] إزالة/تقليل الاعتماد على legacy role في الأماكن الحساسة لصالح permissions
- [ ] Admin-only endpoints مراجعة كاملة (users/admin/workflows/settings)

### 1.4 Logs & privacy
- [ ] منع تسريب PII في logs (هوية/إقامة/رواتب)
- [ ] تأكيد log rotation retention policy

---

## 2) Reliability / DevOps (P0)
### 2.1 Staging environment
- [ ] إنشاء بيئة **Staging** مطابقة للإنتاج (URL منفصل)
- [ ] Supabase project منفصل للـ staging + seed minimal
- [ ] تشغيل PM2 مستقل (staging app + tunnel)
- [ ] Health checks للمكانين

### 2.2 Monitoring & alerting
- [ ] UptimeRobot monitors:
  - [ ] `/api/health`
  - [ ] `/api/status`
- [ ] تفعيل تنبيهات Telegram (إن لزم) + اختبار `scripts/health-monitor.ts`
- [ ] إضافة Error tracking (Sentry أو بديل) + اختبار event من staging

### 2.3 Backups & restore drill
- [ ] جدول backup (DB dump + code snapshot)
- [ ] تنفيذ Restore drill على DB اختبار (staging/test) + توثيق النتيجة
- [ ] تعريف RPO/RTO (كم فقد/كم توقف مقبول)

---

## 3) QA / Testing readiness (P0 → P1)
- [ ] Manual Test Plan للـ Pilot (أهم 20 سيناريو)
- [ ] Automated minimum:
  - [ ] E2E (Playwright): login + إنشاء طلب + موافقة + رفع مرفق + تقرير/طباعة
  - [ ] API integration tests: auth + permissions + workflows
- [ ] Bug triage process (Blocker/High/Medium/Low) + قناة استقبال بلاغات

---

## 4) Performance & scale (P1)
- [ ] قياس أداء الصفحات الأساسية (TTFB/DB latency)
- [ ] مراجعة أهم استعلامات Prisma (slow queries)
- [ ] تفعيل Redis cache فعليًا (إن احتجنا) + مراقبة hit rate
- [ ] وضع حدود للـ pagination والبحث

---

## 5) Data quality (P0 → P1)
- [ ] استيراد الموظفين/الفروع/المراحل + التحقق
- [ ] توحيد JobTitle/Department refs (المشكلة المعروفة)
- [ ] مراجعة حقول حساسة: nationalId, salary, bank

---

## 6) Pilot rollout (P0)
- [ ] اختيار 2–3 فروع + تدريب سريع (30–60 دقيقة)
- [ ] KPI للـ Pilot:
  - [ ] login success rate
  - [ ] 0 blockers
  - [ ] زمن معالجة الطلبات
  - [ ] عدد البلاغات/اليوم
- [ ] يوميًا: تقرير مختصر (أعطال + قرارات)

---

## 7) App Store readiness (P1)
- [ ] قرار التقنية: Wrapper (Capacitor) vs Flutter/Native
- [ ] Privacy Policy + Terms URLs
- [ ] Google Play Data Safety + iOS privacy disclosures
- [ ] Push notifications strategy (FCM/APNs)
- [ ] App signing + release pipeline

---

## 8) Go-Live (P1)
- [ ] Go/No-Go checklist موقع
- [ ] Release notes
- [ ] خطة Hotfix (خلال 24 ساعة)
- [ ] مراقبة أول 72 ساعة
