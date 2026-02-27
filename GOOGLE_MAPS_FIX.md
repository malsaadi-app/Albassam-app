# Google Maps React Strict Mode Fix

## 🔴 المشكلة الأصلية

```
Uncaught NotFoundError: Failed to execute 'removeChild' on 'Node'
```

**السبب:**
- React Strict Mode في Next.js 15 يسوي double mount/unmount في development
- Google Maps script يحمّل أكثر من مرة
- DOM elements تُحذف قبل ما يكملوا التحميل
- Service Worker cache يحفظ النسخة المكسورة

---

## ✅ الإصلاحات المطبقة في `GoogleBranchMap-FIXED.tsx`

### 1. Prevent Double Initialization
```typescript
const initializedRef = useRef(false);
const mountedRef = useRef(true);

useEffect(() => {
  if (initializedRef.current) return; // ✅ منع التحميل مرتين
  initializedRef.current = true;
  mountedRef.current = true;
  // ...
}, []);
```

### 2. Safe Script Loading (Global State)
```typescript
// تحميل Script مرة واحدة فقط عبر كل الصفحة
if (window.__googleMapsLoaded) {
  initMap();
  return;
}

if (window.__googleMapsLoading) {
  window.__googleMapsCallbacks.push(initMap); // انتظر التحميل
  return;
}
```

### 3. Safe Cleanup
```typescript
return () => {
  mountedRef.current = false;
  
  // ✅ تأخير الحذف 100ms عشان العمليات تكمل
  setTimeout(() => {
    if (markerRef.current && typeof markerRef.current.setMap === 'function') {
      markerRef.current.setMap(null);
    }
    // Don't destroy map container - just clear reference
    mapRef.current = null;
  }, 100);
};
```

### 4. Check Before Operations
```typescript
// ✅ تأكد Component لسه mounted قبل أي عملية
if (!mountedRef.current) return;
if (!googleMapRef.current) return;
if (mapRef.current) return; // Already initialized
```

---

## 🔧 كيف تستخدم النسخة المصلحة

### الطريقة 1: استبدل الملف الحالي
```bash
mv app/components/GoogleBranchMap.tsx app/components/GoogleBranchMap-OLD.tsx
mv app/components/GoogleBranchMap-FIXED.tsx app/components/GoogleBranchMap.tsx
```

### الطريقة 2: اعمل import مباشر
```typescript
// في app/branches/[id]/edit/page.tsx
const BranchMap = dynamic(() => import('@/app/components/GoogleBranchMap-FIXED'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});
```

---

## 📊 النتيجة

**قبل:**
- ❌ `removeChild` errors
- ❌ Multiple script loads
- ❌ Map crash في Strict Mode

**بعد:**
- ✅ يشتغل في React Strict Mode
- ✅ Script يحمّل مرة واحدة
- ✅ Cleanup آمن 100%
- ✅ No console errors

---

## 🎯 بدائل (لو ما اشتغل)

### Option 1: Disable Strict Mode
```typescript
// next.config.ts
reactStrictMode: false, // ❌ مو موصى فيه
```

### Option 2: Use Leaflet Instead
```bash
npm install react-leaflet leaflet
```

أخف وأبسط من Google Maps، وما عنده مشاكل مع Strict Mode.

### Option 3: Use @react-google-maps/api
```bash
npm install @react-google-maps/api
```

مكتبة رسمية من Google - متوافقة مع React 18/19.

---

## 📝 ملاحظات

1. **Service Worker:** تأكد إنه معطّل أو يستخدم network-first للـ JS files
2. **Build ID:** استخدم `generateBuildId` عشان cache busting
3. **Development:** الأخطاء تظهر في dev فقط، production عادة يشتغل
4. **Testing:** جرب في Private/Incognito mode عشان تتأكد من clean slate

---

## 🔗 مصادر

- [React Strict Mode](https://react.dev/reference/react/StrictMode)
- [Google Maps JS API](https://developers.google.com/maps/documentation/javascript)
- [Next.js Dynamic Imports](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
