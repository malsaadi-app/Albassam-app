# ⚡ المسار السريع - 4 أسابيع

**تاريخ البدء:** 2026-03-10  
**تاريخ الإطلاق المتوقع:** 2026-04-07  
**الحالة:** 🔴 قيد التنفيذ

---

## 📋 المراحل (4 مراحل)

### ✅ المرحلة 0: الإعداد (1 يوم) - اليوم
```
☑ فحص النظام
☑ جرد الصفحات
☑ فحص i18n الحالي
☑ إنشاء الخطط
☐ تجهيز البيئة
```

---

## 📦 المرحلة 1: الترجمة السريعة (أسبوع واحد)

### Day 1 (غداً): تحليل وتجهيز
```
Hour 1-2: استخراج النصوص
  ☐ Extract من app/translations/index.ts
  ☐ Extract من الصفحات (122 موقع)
  ☐ تنظيم في JSON files

Hour 3-4: تنظيم الملفات
  ☐ إنشاء messages/ar.json
  ☐ إنشاء messages/en.json
  ☐ تجهيز الهيكل

Hour 5-6: البداية بالترجمة
  ☐ ترجمة common (50 key)
  ☐ ترجمة auth (20 key)
  ☐ ترجمة navigation (30 key)

Hour 7-8: اختبار أولي
  ☐ test على صفحة واحدة
  ☐ التأكد من RTL/LTR
```

### Day 2: ترجمة المكونات الرئيسية
```
☐ HR module (200 keys)
☐ Tasks module (50 keys)
☐ Procurement (100 keys)
☐ Attendance (80 keys)
```

### Day 3: ترجمة باقي الوحدات
```
☐ Finance (40 keys)
☐ Maintenance (60 keys)
☐ Settings (100 keys)
☐ Admin (50 keys)
```

### Day 4: الفورمات والرسائل
```
☐ Form labels (100 keys)
☐ Validation messages (80 keys)
☐ Error messages (60 keys)
☐ Success messages (40 keys)
```

### Day 5: المراجعة والاختبار
```
☐ مراجعة جميع الترجمات
☐ اختبار على 10 صفحات رئيسية
☐ إصلاح الأخطاء
☐ commit & push
```

**Output:**
✅ 1,100+ key مترجم كاملاً
✅ messages/ar.json + messages/en.json
✅ جاهز للاستخدام

---

## 📱 المرحلة 2: App Stores Prep (أسبوعان)

### Week 2: Capacitor Setup

**Day 6: تجهيز البيئة**
```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android

# Initialize
npx cap init "Albassam Platform" "com.albassam.platform"

# Install plugins
npm install @capacitor/push-notifications
npm install @capacitor/camera
npm install @capacitor/geolocation
npm install @capacitor/status-bar
npm install @capacitor/splash-screen
```

**Day 7: PWA Enhancement**
```
☐ تحسين manifest.json
☐ إضافة جميع الأيقونات
☐ Service worker optimization
☐ Offline support
```

**Day 8-9: iOS Setup**
```bash
# Build
npm run build

# Add iOS
npx cap add ios
npx cap sync ios

# Open in Xcode
npx cap open ios

# Configure:
☐ App icons
☐ Launch screen
☐ Signing
☐ Privacy descriptions
```

**Day 10: iOS Testing**
```
☐ Test على iPhone simulator
☐ Test على iPad simulator
☐ Test على real device
☐ Fix issues
```

### Week 3: Android & Assets

**Day 11-12: Android Setup**
```bash
# Add Android
npx cap add android
npx cap sync android

# Open in Android Studio
npx cap open android

# Configure:
☐ App icons (mipmap)
☐ Splash screen
☐ Signing keystore
☐ Permissions
```

**Day 13: Android Testing**
```
☐ Test على Android emulator
☐ Test على real device
☐ Test على Samsung device
☐ Fix issues
```

**Day 14-15: Assets Preparation**
```
App Store:
☐ Screenshots iPhone (5 images)
☐ Screenshots iPad (5 images)
☐ App icon 1024x1024
☐ Description (AR + EN)
☐ Keywords

Play Store:
☐ Screenshots (8 images)
☐ Feature graphic
☐ App icon 512x512
☐ Description (AR + EN)
☐ What's new
```

---

## 🚀 المرحلة 3: Testing & Launch (أسبوع)

### Week 4: Final Testing & Submission

**Day 16-17: Testing**
```
☐ Functional testing (core flows)
☐ i18n testing (AR + EN)
☐ Mobile testing (iOS + Android)
☐ Performance check
☐ Fix critical bugs only
```

**Day 18: iOS Submission**
```
☐ Create App Store record
☐ Upload build via Xcode
☐ Fill all metadata
☐ Submit for review
```

**Day 19: Android Submission**
```
☐ Create Play Store record
☐ Upload APK/AAB
☐ Fill all metadata
☐ Submit for review
```

**Day 20-28: Review & Launch**
```
Day 20-23: iOS review (1-3 days usually)
Day 24: Android review (2-24 hours)
Day 25-28: Handle any rejections, resubmit, GO LIVE! 🎉
```

---

## 📊 Progress Tracker

### Week 1: i18n ⏳
```
Day 1: ☐ 0%
Day 2: ☐ 0%
Day 3: ☐ 0%
Day 4: ☐ 0%
Day 5: ☐ 0%
```

### Week 2: iOS Setup ⏳
```
Day 6: ☐ 0%
Day 7: ☐ 0%
Day 8-9: ☐ 0%
Day 10: ☐ 0%
```

### Week 3: Android & Assets ⏳
```
Day 11-12: ☐ 0%
Day 13: ☐ 0%
Day 14-15: ☐ 0%
```

### Week 4: Launch ⏳
```
Day 16-17: ☐ 0%
Day 18: ☐ 0%
Day 19: ☐ 0%
Day 20-28: ☐ 0%
```

---

## 🎯 Success Criteria

### Week 1 Done:
✅ All text translated (1,100+ keys)
✅ AR/EN working on all pages
✅ No hard-coded text

### Week 2 Done:
✅ iOS app builds successfully
✅ iOS app tested on device
✅ All features work on iOS

### Week 3 Done:
✅ Android app builds successfully
✅ Android app tested on device
✅ All assets ready

### Week 4 Done:
✅ iOS submitted to App Store
✅ Android submitted to Play Store
✅ Apps approved & live! 🎉

---

## 💰 Budget

```
Apple Developer: $99
Google Play: $25
Total: $124
```

---

## ⚠️ Risks & Mitigation

**Risk 1: Translation takes longer**
- Mitigation: Use DeepL API for first draft
- Backup: Manual review + corrections

**Risk 2: iOS/Android build issues**
- Mitigation: Test early, fix daily
- Backup: Community support + docs

**Risk 3: App Store rejection**
- Mitigation: Follow guidelines strictly
- Backup: Quick fix & resubmit (1-2 days)

---

## 📞 Daily Check-ins

```
End of each day:
☐ What was completed?
☐ Any blockers?
☐ Plan for tomorrow?
☐ Update progress %
```

---

**READY TO START! 🚀**

Next step: Day 1 - استخراج وتنظيم النصوص
