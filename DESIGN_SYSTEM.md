# Albassam Schools App — Design System (v1)

> هدف هذا الملف: توحيد الشكل (UI) والتجربة (UX) عبر جميع صفحات النظام مع الحفاظ على القيود التقنية الحالية (Next.js + TypeScript + Inline Styles).

## 1) المبادئ (Modern UI/UX)

1. **وضوح + تسلسل بصري**: عناوين قوية، نص ثانوي muted، وأرقام KPI واضحة.
2. **Surface-first**: واجهة مبنية على أسطح (Cards) مع حدود خفيفة وظلال محسوبة.
3. **Motion خفيف**: انتقالات بسيطة (fade/raise) بدون أي مبالغة.
4. **RTL أصيل**: اتجاه RTL، توزيع مناسب للأيقونات والنصوص.
5. **Responsive بدون تعقيد**: استخدام CSS Grid مع `repeat(auto-fit, minmax(...))` و`clamp()` لتفادي media queries قدر الإمكان.
6. **Dark mode**: عبر CSS variables + `prefers-color-scheme` (اختياري لكنه مفعّل كبنية أساسية).

---

## 2) Design Tokens

### 2.1 مصدر التوكنز
- يتم تعريف التوكنز كـ **CSS Variables** في:
  - `app/components/ui/DesignSystemStyles.tsx`
- ويتم استهلاكها داخل الصفحات عبر **Inline Styles** باستخدام `var(--ds-...)`.
- مساعدات TypeScript:
  - `lib/ui/ds.ts`

### 2.2 الألوان (Color Palette)

**Brand**
- `--ds-brand-900`: #1D0B3E
- `--ds-brand-800`: #2D1B4E
- `--ds-brand-700`: #3D2B5E

**Accent (Gold)**
- `--ds-accent-600`: #C49564
- `--ds-accent-500`: #D4A574
- `--ds-accent-400`: #E4B584

**Semantic**
- `--ds-info`: #3B82F6
- `--ds-success`: #10B981
- `--ds-warning`: #F59E0B
- `--ds-danger`: #EF4444

**Neutrals / Surfaces**
- `--ds-bg`: خلفية الصفحة
- `--ds-bg-elevated`: طبقة زجاجية خفيفة
- `--ds-surface`: Card Surface
- `--ds-surface-2`: Surface ثانوي
- `--ds-text`, `--ds-text-2`, `--ds-muted`
- `--ds-border`, `--ds-border-strong`

**Dark mode**
- يتم عمل override تلقائي داخل `@media (prefers-color-scheme: dark)`.

---

## 3) Typography

- الخط الأساسي: `--ds-font-sans: 'Cairo', system-ui, ...`
- Scale (موجودة كمساعدات في `lib/ui/ds.ts`):
  - `text.display`: عنوان رئيسي (Responsive عبر `clamp()`)
  - `text.h2`, `text.h3`
  - `text.body`, `text.small`

ملاحظات:
- استخدم **Font Weight** عالية للعناوين والأرقام (800–950) لتعزيز الإبهار والوضوح.
- اجعل النص الثانوي muted دائماً (`--ds-muted`).

---

## 4) Spacing & Layout

- القاعدة: 8px grid (تقريباً).
- استخدم `clamp()` للمساحات الرئيسية:
  - padding container: `clamp(18px, 3.4vw, 36px)`
- Grid responsiveness:
  - `gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'`

---

## 5) Components (Server-friendly)

> ملاحظة: بما أن الهدف SSR قدر الإمكان، تجنّب handlers في المكوّنات العامة.

**المكوّنات/الأنماط المستخدمة حالياً (Proof of concept في Dashboard):**
- Card / Glass Surface
- StatTile / MiniMetric
- InfoCard
- Pill
- Buttons كـ Links
- Sparkline (SVG)
- RingProgress (SVG)

المصدر:
- `app/dashboard/page.tsx`

يمكن لاحقاً استخراج هذه المكوّنات إلى `app/components/ui/*` لإعادة الاستخدام عبر النظام.

---

## 6) Motion (Animations)

- Keyframes ضمن `DesignSystemStyles.tsx`:
  - `ds-fade-up`
  - `ds-pulse-soft`
  - `ds-spin`

- Hover micro-interaction (اختياري وآمن):
  - `.ds-card-hover:hover { transform, box-shadow, border-color }`

---

## 7) Accessibility

- Focus ring:
  - `.ds-focusable:focus-visible { box-shadow: var(--ds-ring); }`
- استخدم نصوص واضحة وتباين جيد خاصة في dark mode.

---

## 8) حالة التنفيذ الحالية (Status)

### ✅ تم تنفيذ
1. **Design tokens + dark mode skeleton**
   - `app/components/ui/DesignSystemStyles.tsx`
   - مدمج داخل `app/layout.tsx`
2. **Dashboard redesign كـ Proof of Concept (SSR)**
   - `app/dashboard/page.tsx` أعيدت كتابته ليكون Server Component
   - إزالة الاعتماد على Chart.js داخل الداشبورد واستبداله بـ SVG (Sparkline/Ring)
3. **Refactor لبيانات الداشبورد**
   - منطق البيانات أصبح في `lib/dashboard/enhanced.ts`
   - API يستخدم نفس المنطق: `app/api/dashboard/enhanced/route.ts`
4. **Refactor لطلبات الموافقة المعلقة**
   - `lib/dashboard/pendingApprovals.ts`
   - API route يستخدمه: `app/api/dashboard/pending-approvals/route.ts`

### ⏭️ الخطوة التالية المقترحة
- استخراج مكوّنات Dashboard UI إلى `app/components/ui/*`.
- توحيد صفحات: Tasks / HR / Procurement / Settings على نفس Tokens (Card/Button/Input).
- مراجعة القيود (SSR فقط + Inline only) لأن المشروع الحالي يحتوي على client components وTailwind classes في صفحات متعددة.

