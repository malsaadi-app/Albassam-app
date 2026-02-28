# Albassam Group Platform - Mobile App

تطبيق جوال لمنصة مجموعة البسام يدعم iOS و Android، يوفر وصولاً متكاملاً لأنظمة الحضور، الموارد البشرية، المشتريات، الصيانة، والموافقات.

## ✨ المميزات

- 🌐 **دعم متعدد اللغات**: العربية (افتراضي) والإنجليزية
- 🔐 **المصادقة الآمنة**: تسجيل الدخول باسم المستخدم وكلمة المرور مع تخزين آمن للتوكنات
- 📱 **تصميم متجاوب**: واجهة مستخدم حديثة تدعم الوضع الفاتح والداكن
- 🎯 **5 وحدات رئيسية**:
  - ⏰ الحضور
  - 👥 الموارد البشرية
  - 🛒 المشتريات
  - 🔧 الصيانة
  - ✅ الموافقات

## 📋 المتطلبات

- Flutter SDK >= 3.0.0
- Dart SDK >= 3.0.0
- Android Studio / Xcode (للتطوير على Android/iOS)
- جهاز أو محاكي لتشغيل التطبيق

## 🚀 بدء التشغيل

### 1. تثبيت Flutter

إذا لم يكن Flutter مثبتاً، اتبع التعليمات الرسمية:
- [Flutter Installation Guide](https://docs.flutter.dev/get-started/install)

تحقق من التثبيت:
```bash
flutter doctor
```

### 2. استنساخ المشروع

```bash
cd /data/.openclaw/workspace/mobile/albassam_platform
```

### 3. تثبيت الحزم

```bash
flutter pub get
```

### 4. تكوين API

قم بتحديث عنوان API في الملف:
```
lib/core/services/api_service.dart
```

غيّر السطر:
```dart
static const String baseUrl = 'https://app.albassam-app.com/api';
```

إلى عنوان API الفعلي الخاص بك.

### 5. تشغيل التطبيق

#### Android
```bash
flutter run
```

#### iOS (على macOS فقط)
```bash
flutter run -d ios
```

#### الويب (للتطوير فقط)
```bash
flutter run -d chrome
```

## 📁 هيكل المشروع

```
lib/
├── core/                     # الوحدات الأساسية
│   ├── constants/           # الثوابت
│   ├── navigation/          # نظام التنقل
│   ├── services/            # خدمات API والمصادقة
│   ├── storage/             # التخزين الآمن
│   └── theme/               # الثيمات والألوان
├── features/                # الوحدات الوظيفية
│   ├── auth/               # المصادقة (تسجيل الدخول)
│   ├── home/               # الشاشة الرئيسية
│   ├── attendance/         # الحضور
│   ├── hr/                 # الموارد البشرية
│   ├── procurement/        # المشتريات
│   ├── maintenance/        # الصيانة
│   └── approvals/          # الموافقات
├── l10n/                    # الترجمة والتعريب
└── main.dart               # نقطة البداية
```

## 🔧 التطوير

### إضافة وحدة جديدة

1. أنشئ مجلد جديد في `lib/features/`
2. أضف ثلاثة مجلدات فرعية: `data/`, `domain/`, `presentation/`
3. أنشئ الشاشات في `presentation/`
4. أضف الترجمات في `lib/l10n/`

### تحديث الترجمات

عدّل الملفات:
- `lib/l10n/app_localizations_ar.dart` (العربية)
- `lib/l10n/app_localizations_en.dart` (الإنجليزية)

### تخصيص الثيم

عدّل الألوان والأنماط في:
```
lib/core/theme/app_theme.dart
```

## 🔐 API Integration

### تنسيق استجابة تسجيل الدخول المتوقع

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "username": "ahmed.mohamed",
    "name": "أحمد محمد",
    "role": "employee"
  }
}
```

### Endpoints المطلوبة

- `POST /auth/login` - تسجيل الدخول
- `POST /auth/logout` - تسجيل الخروج
- `POST /auth/refresh` - تجديد التوكن

## 🧪 الاختبار

```bash
# تشغيل الاختبارات
flutter test

# اختبارات التكامل
flutter drive --target=test_driver/app.dart
```

## 📦 البناء للإنتاج

### Android APK
```bash
flutter build apk --release
```

### Android App Bundle (للنشر على Google Play)
```bash
flutter build appbundle --release
```

### iOS (على macOS)
```bash
flutter build ios --release
```

## 🔒 الأمان

- التوكنات محفوظة بشكل آمن باستخدام `flutter_secure_storage`
- كلمات المرور لا يتم حفظها محلياً
- HTTPS فقط للاتصال بالAPI
- التحقق من صلاحيات المستخدم على مستوى API

## 🐛 استكشاف الأخطاء

### مشكلة: flutter: command not found
```bash
# أضف Flutter إلى PATH
export PATH="$PATH:`pwd`/flutter/bin"
```

### مشكلة: فشل pub get
```bash
# نظف ذاكرة التخزين المؤقت
flutter clean
flutter pub get
```

### مشكلة: أخطاء البناء على Android
```bash
cd android
./gradlew clean
cd ..
flutter clean
flutter pub get
```

## 📝 ملاحظات مهمة

1. **التطوير الأولي**: هذا هيكل أساسي، يحتاج إلى:
   - ربط فعلي بـ API endpoints
   - معالجة أخطاء شاملة
   - تحسين UX/UI
   - إضافة unit tests
   
2. **قبل النشر**:
   - غيّر package name في `pubspec.yaml`
   - أضف أيقونة التطبيق
   - حدّث splash screen
   - أضف signing للإنتاج (Android: keystore, iOS: certificates)

3. **الأداء**:
   - استخدم lazy loading للبيانات
   - أضف caching للطلبات المتكررة
   - راقب استهلاك الذاكرة

## 🤝 المساهمة

عند إضافة ميزات جديدة:
1. اتبع هيكل المشروع الموجود
2. أضف التعليقات بالعربية
3. اختبر على iOS و Android
4. حدّث README إذا لزم الأمر

## 📞 الدعم

للمشاكل التقنية أو الأسئلة، تواصل مع فريق التطوير.

## 📄 الترخيص

© 2026 Albassam Group. جميع الحقوق محفوظة.

---

**الإصدار**: 1.0.0  
**آخر تحديث**: فبراير 2026
