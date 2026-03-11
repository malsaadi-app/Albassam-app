# 📱 Mobile App Setup Guide

**Project:** Albassam HR System  
**Date:** 11 March 2026  
**Phase 2 Status:** ✅ PARTIAL COMPLETE (Android ✅ | iOS ⏸️ needs Xcode)

---

## ✅ What's Been Configured

### **Android Configuration** ✅ COMPLETE

#### 1. Permissions Added (`AndroidManifest.xml`)
```xml
✅ INTERNET - App connectivity
✅ USE_BIOMETRIC - Biometric authentication
✅ USE_FINGERPRINT - Fingerprint fallback
✅ POST_NOTIFICATIONS - Push notifications
⏸️ CAMERA - Commented (enable when needed)
⏸️ ACCESS_FINE_LOCATION - Commented (enable for attendance)
```

#### 2. App Configuration (`build.gradle`)
```gradle
applicationId: "com.albassam.hrapp"
minSdkVersion: 22 (Android 5.1+)
targetSdkVersion: 33 (Android 13)
versionCode: 1
versionName: "1.0"
```

#### 3. App Name (`strings.xml`)
```xml
app_name: مدارس البسام ✅
```

**Android Status:** Ready for build! 🚀

---

### **iOS Configuration** ✅ COMPLETE (Needs Xcode for Build)

#### 1. Permissions Added (`Info.plist`)
```xml
✅ NSFaceIDUsageDescription - Face ID permission
✅ NSAppTransportSecurity - HTTPS enforcement
✅ CFBundleDevelopmentRegion - RTL support (Arabic)
⏸️ NSCameraUsageDescription - Commented (enable when needed)
⏸️ NSPhotoLibraryUsageDescription - Commented
⏸️ NSLocationWhenInUseUsageDescription - Commented
```

#### 2. App Configuration
```
CFBundleDisplayName: مدارس البسام ✅
Bundle ID: com.albassam.hrapp ✅
```

**iOS Status:** Configuration complete, needs Xcode for building 🍎

---

### **Biometric Authentication Service** ✅ COMPLETE

Created: `lib/biometric-auth.ts` (5KB)

**Functions Available:**
1. `checkBiometricAvailable()` - Check if device supports biometrics
2. `authenticateWithBiometric()` - Trigger biometric authentication
3. `saveCredentials()` - Save login credentials securely
4. `getCredentials()` - Retrieve saved credentials
5. `deleteCredentials()` - Remove saved credentials
6. `isBiometricEnabled()` - Check if biometric is enabled
7. `getBiometricTypeName()` - Get type name in Arabic
8. `getBiometricIcon()` - Get appropriate emoji icon

**Supported:**
- ✅ Face ID (iOS)
- ✅ Touch ID (iOS)
- ✅ Fingerprint (Android)
- ✅ Face Unlock (Android)
- ✅ Iris Scanner (Android - some devices)

---

## 🚀 Next Steps

### **Option A: Build Android App Now** (30 min)

Requirements:
- Android Studio installed
- OR command-line Android SDK

Steps:
```bash
# 1. Open Android Studio
npx cap open android

# 2. In Android Studio:
#    - Build → Generate Signed Bundle/APK
#    - Choose APK
#    - Create new keystore (first time)
#    - Build release APK

# 3. OR from command line:
cd android
./gradlew assembleRelease

# APK will be in:
# android/app/build/outputs/apk/release/app-release.apk
```

### **Option B: Build iOS App** (Needs macOS)

Requirements:
- macOS with Xcode installed
- Apple Developer account ($99/year)

Steps:
```bash
# 1. Open Xcode
npx cap open ios

# 2. In Xcode:
#    - Select Team (Apple Developer account)
#    - Set Bundle ID: com.albassam.hrapp
#    - Product → Archive
#    - Upload to App Store Connect

# 3. TestFlight:
#    - Invite beta testers
#    - Test on real devices
```

### **Option C: Test in Simulators First** (Recommended)

**Android Emulator:**
```bash
# Start emulator (if installed)
npx cap run android

# Or open Android Studio and run
```

**iOS Simulator:**
```bash
# macOS only
npx cap run ios

# Or open Xcode and run
```

---

## 📦 Assets Still Needed

### **1. App Icons** (Priority: HIGH)

**Sizes Required:**

**iOS:**
- 1024x1024 - App Store
- 180x180 - iPhone @3x
- 120x120 - iPhone @2x
- 87x87 - iPhone @3x Settings
- 80x80 - iPad @2x
- 76x76 - iPad
- 60x60 - iPhone @2x
- 58x58 - iPhone @2x Settings
- 40x40 - iPad / iPhone
- 29x29 - Settings
- 20x20 - Notification

**Android:**
- 512x512 - Play Store
- 192x192 - xxxhdpi
- 144x144 - xxhdpi
- 96x96 - xhdpi
- 72x72 - hdpi
- 48x48 - mdpi

**Current Status:** Using default Capacitor icons ⚠️

**Tools:**
- https://easyappicon.com (free, recommended)
- https://makeappicon.com (free)
- Figma/Photoshop (design first)

### **2. Splash Screens** (Priority: MEDIUM)

Current: Default blue Capacitor splash ⚠️

Needed:
- iOS: Various sizes for iPhone/iPad
- Android: Various densities (ldpi to xxxhdpi)

**Recommendation:** 
- Use app icon + brand color (#1D0B3E)
- Keep it simple (logo + name)

### **3. Screenshots** (Priority: HIGH for Store Submission)

**iOS Requirements:**
- iPhone 6.7" (1290x2796) - 3-8 screenshots
- iPhone 6.5" (1242x2688) - 3-8 screenshots
- iPad Pro 12.9" (2048x2732) - Optional

**Android Requirements:**
- Phone (1080x1920) - 2-8 screenshots
- Tablet - Optional

**Recommended Screenshots:**
1. Login screen (with biometric)
2. Dashboard / Home
3. Employee management
4. Attendance tracking
5. Payroll view
6. Requests/Approvals
7. Analytics
8. Profile/Settings

---

## 🔐 Biometric Implementation Example

### **Login Page Integration**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { 
  checkBiometricAvailable, 
  authenticateWithBiometric,
  saveCredentials,
  getCredentials,
  isBiometricEnabled,
  getBiometricIcon,
  getBiometricTypeName,
} from '@/lib/biometric-auth';

export default function LoginPage() {
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<any>(null);
  
  useEffect(() => {
    checkBiometric();
  }, []);
  
  async function checkBiometric() {
    const { available, type } = await checkBiometricAvailable();
    setBiometricAvailable(available);
    setBiometricType(type);
  }
  
  // Biometric login
  async function handleBiometricLogin() {
    // 1. Authenticate with biometric
    const { success, error } = await authenticateWithBiometric();
    
    if (!success) {
      alert(error || 'فشل التحقق من البصمة');
      return;
    }
    
    // 2. Get saved credentials
    const credentials = await getCredentials();
    
    if (!credentials) {
      alert('لا توجد بيانات محفوظة');
      return;
    }
    
    // 3. Login with saved credentials
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    
    if (response.ok) {
      window.location.href = '/dashboard';
    } else {
      alert('فشل تسجيل الدخول');
    }
  }
  
  // Normal login
  async function handleNormalLogin(e: React.FormEvent) {
    e.preventDefault();
    
    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    if (response.ok) {
      // Ask to save for biometric
      if (biometricAvailable && !isBiometricEnabled()) {
        const save = confirm('حفظ بيانات الدخول للاستخدام مع البصمة؟');
        if (save) {
          await saveCredentials(username, password);
        }
      }
      
      window.location.href = '/dashboard';
    } else {
      alert('فشل تسجيل الدخول');
    }
  }
  
  return (
    <div className="login-container">
      <h1>تسجيل الدخول</h1>
      
      {/* Biometric button */}
      {biometricAvailable && isBiometricEnabled() && (
        <button 
          onClick={handleBiometricLogin}
          className="biometric-button"
        >
          {getBiometricIcon(biometricType)} {getBiometricTypeName(biometricType)}
        </button>
      )}
      
      <div className="divider">أو</div>
      
      {/* Normal login form */}
      <form onSubmit={handleNormalLogin}>
        <input name="username" placeholder="اسم المستخدم" required />
        <input name="password" type="password" placeholder="كلمة المرور" required />
        <button type="submit">دخول</button>
      </form>
    </div>
  );
}
```

---

## 📝 Environment Detection

To check if app is running in Capacitor (mobile) vs browser:

```typescript
import { Capacitor } from '@capacitor/core';

// Check if running in native app
const isNative = Capacitor.isNativePlatform();

// Get platform
const platform = Capacitor.getPlatform(); // 'ios', 'android', or 'web'

// Platform-specific code
if (isNative) {
  // Running in mobile app
  // Enable biometric, push notifications, etc.
} else {
  // Running in browser
  // Use web alternatives
}
```

---

## 🔧 Build Commands Reference

### **Development**
```bash
# Run on Android
npx cap run android

# Run on iOS (macOS only)
npx cap run ios

# Open in IDEs
npx cap open android  # Android Studio
npx cap open ios      # Xcode
```

### **Production Build**
```bash
# Build web assets first
npm run build

# Sync to native projects
npx cap sync

# Then build in Android Studio or Xcode
```

### **Release Android APK**
```bash
cd android
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

### **Release iOS IPA**
```bash
# In Xcode:
# Product → Archive
# Distribute App → App Store Connect
```

---

## 🐛 Common Issues

### **Android build fails**
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew build
```

### **iOS build fails**
```bash
# Update pods
cd ios/App
pod install
pod update
```

### **Plugins not syncing**
```bash
# Force sync
npx cap sync --force
```

### **"Could not find module"**
```bash
# Reinstall
npm install
npx cap sync
```

---

## 📊 Current Status Summary

```
╔════════════════════════════════════════════════╗
║   📱 MOBILE APP CONFIGURATION STATUS          ║
╚════════════════════════════════════════════════╝

Android:
✅ Permissions configured
✅ Build config ready
✅ App name set (Arabic)
✅ Biometric permissions added
✅ Ready for build

iOS:
✅ Permissions configured
✅ Bundle ID set
✅ App name set (Arabic)
✅ Face ID permission added
⏸️ Needs Xcode for build

Biometric Service:
✅ Library created (5KB)
✅ 8 functions ready
✅ iOS + Android support
✅ Arabic localization
✅ Ready for integration

Assets:
⚠️ App icons needed (use defaults for now)
⚠️ Splash screens needed (use defaults)
⏸️ Screenshots needed (for store submission)

Next:
1. Create app icons (HIGH priority)
2. Test on Android emulator
3. Test on iOS simulator (needs macOS)
4. Integrate biometric login
5. Take screenshots
6. Submit to stores
```

---

## 💰 Costs Reminder

- Apple Developer: $99/year (for iOS)
- Google Play: $25 one-time (for Android)
- **Total Year 1:** $136

---

## 📞 Support Resources

- Capacitor Docs: https://capacitorjs.com
- Biometric Plugin: https://github.com/aparajita/capacitor-biometric-auth
- Android Studio: https://developer.android.com/studio
- Xcode: https://developer.apple.com/xcode

---

**Last Updated:** 11 March 2026, 9:35 PM  
**Next Step:** Create app icons or test in emulator  
**Status:** Ready for Phase 3! 🚀
