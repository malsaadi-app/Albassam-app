# مشروع تطبيق البسام للجوال

## 🎯 الهدف
تطبيق جوال شامل لإدارة عمليات مجموعة البسام على iOS و Android.

## 🏗️ الحالة الحالية
**مرحلة**: Scaffold / Initial Structure  
**الإصدار**: 1.0.0  
**آخر تحديث**: 27 فبراير 2026

## ✅ ما تم إنجازه
- [x] هيكل المشروع الأساسي
- [x] نظام المصادقة (UI + Logic)
- [x] تعريب كامل (عربي/إنجليزي)
- [x] 5 وحدات رئيسية (واجهات أولية)
- [x] Theme system
- [x] Navigation structure
- [x] API service layer
- [x] Secure storage

## 🔄 ما يحتاج عمل
- [ ] ربط API endpoints الحقيقية
- [ ] تطبيق business logic لكل وحدة
- [ ] Unit & integration tests
- [ ] معالجة أخطاء شاملة
- [ ] Offline support
- [ ] Push notifications
- [ ] App icon & splash customization
- [ ] iOS/Android signing للإنتاج

## 🚀 للتشغيل السريع

```bash
# تثبيت الحزم
flutter pub get

# تشغيل على محاكي
flutter run

# بناء APK للتجربة
flutter build apk --debug
```

## 📞 نقاط الاتصال الرئيسية

### تحديث API URL
📁 `lib/core/services/api_service.dart`  
```dart
static const String baseUrl = 'https://api.albassam.com/v1';
```

### إضافة ترجمات
📁 `lib/l10n/app_localizations_ar.dart`  
📁 `lib/l10n/app_localizations_en.dart`

### تعديل الألوان
📁 `lib/core/theme/app_theme.dart`

## 📚 المراجع
- [Flutter Documentation](https://docs.flutter.dev)
- [Provider State Management](https://pub.dev/packages/provider)
- [Dio HTTP Client](https://pub.dev/packages/dio)

## 🎓 للمطورين الجدد
اقرأ `README.md` للتعليمات التفصيلية والتوثيق الكامل.
