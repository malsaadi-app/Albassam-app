# 📱 Capacitor Setup - Complete Guide

**Date:** 11 March 2026, 9:22 PM  
**Status:** ✅ Phase 1 COMPLETE  
**Duration:** 15 minutes

---

## ✅ What We've Done (Phase 1)

### 1. Installed Capacitor Core
```bash
npm install @capacitor/core @capacitor/cli
```

**Result:** ✅ Capacitor 8.x installed

### 2. Initialized Capacitor Project
```bash
npx cap init "مدارس البسام" "com.albassam.hrapp" --web-dir=".next"
```

**Created:**
- `capacitor.config.ts` - Main configuration file
- App ID: `com.albassam.hrapp`
- App Name: `مدارس البسام`

### 3. Added iOS & Android Platforms
```bash
npx cap add ios
npx cap add android
```

**Created:**
- `/ios/` - Native iOS Xcode project
- `/android/` - Native Android Gradle project

### 4. Installed Essential Plugins
```bash
npm install @capacitor/splash-screen
npm install @capacitor/keyboard  
npm install @capacitor/status-bar
npm install @capacitor/app
npm install @aparajita/capacitor-biometric-auth
```

**Plugins Installed (5 total):**
1. ✅ **SplashScreen** - Launch screen with logo
2. ✅ **Keyboard** - Keyboard behavior & resizing
3. ✅ **StatusBar** - Status bar styling (iOS/Android)
4. ✅ **App** - App lifecycle events
5. ✅ **BiometricAuth** - Face ID / Touch ID / Fingerprint

### 5. Configured Capacitor
**File:** `capacitor.config.ts`

**Key Settings:**
```typescript
{
  appId: 'com.albassam.hrapp',
  appName: 'مدارس البسام',
  webDir: 'out',
  
  server: {
    url: 'https://app.albassam-app.com', // Production server
    cleartext: false, // Force HTTPS
  },
  
  plugins: {
    SplashScreen: {
      backgroundColor: '#1D0B3E', // Brand color
      launchShowDuration: 2000,
    },
    Keyboard: {
      resize: 'native',
      style: 'dark',
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1D0B3E',
    },
  },
}
```

**Architecture Decision:** Hybrid App
- App loads from production server (https://app.albassam-app.com)
- Benefits:
  - ✅ Instant updates (no App Store approval)
  - ✅ Same codebase for web + mobile
  - ✅ Easier maintenance
  - ✅ Smaller app size

### 6. Synced Native Projects
```bash
npx cap sync
```

**Result:** ✅ All plugins synced to iOS & Android

---

## 📂 Project Structure

```
albassam-tasks/
├── android/                    # Android Studio project
│   ├── app/
│   │   └── src/main/
│   │       ├── assets/public/  # Web assets
│   │       └── AndroidManifest.xml
│   ├── build.gradle
│   └── gradle.properties
├── ios/                        # Xcode project  
│   ├── App/
│   │   ├── App/
│   │   │   ├── public/         # Web assets
│   │   │   └── Info.plist
│   │   └── App.xcodeproj
│   └── Podfile
├── out/                        # Placeholder web dir
│   └── index.html
├── capacitor.config.ts         # Capacitor config
└── package.json                # Updated with plugins
```

---

## 🎯 Current Status

### ✅ Complete
- [x] Capacitor installed
- [x] iOS project created
- [x] Android project created
- [x] 5 essential plugins installed
- [x] Configuration completed
- [x] Native projects synced

### ⏸️ Next Steps (Phase 2)

**1. iOS Configuration** (30-45 minutes)
- [ ] Open Xcode project
- [ ] Configure app icons (1024x1024 + all sizes)
- [ ] Configure splash screen
- [ ] Set bundle ID & team
- [ ] Configure Info.plist permissions
- [ ] Build & test on simulator

**2. Android Configuration** (30-45 minutes)
- [ ] Open Android Studio project
- [ ] Configure app icons (adaptive icon)
- [ ] Configure splash screen
- [ ] Set applicationId
- [ ] Configure AndroidManifest.xml permissions
- [ ] Build & test on emulator

**3. Biometric Implementation** (1-2 hours)
- [ ] Create biometric auth service
- [ ] Integrate with login page
- [ ] Test Face ID (iOS)
- [ ] Test Touch ID (iOS)
- [ ] Test Fingerprint (Android)

**4. Assets Creation** (1-2 days)
- [ ] Design app icon (1024x1024)
- [ ] Generate all icon sizes
- [ ] Create splash screen design
- [ ] Take screenshots for stores
- [ ] Write app descriptions

**5. Testing** (2-3 days)
- [ ] Internal testing
- [ ] Beta testing
- [ ] Bug fixes

**6. Store Submission** (1-2 weeks)
- [ ] Register Apple Developer ($99)
- [ ] Register Google Play ($25)
- [ ] Submit iOS app
- [ ] Submit Android app
- [ ] Wait for review

---

## 🛠️ Commands Reference

### Development Commands
```bash
# Open iOS in Xcode
npx cap open ios

# Open Android in Android Studio
npx cap open android

# Sync after changes
npx cap sync

# Build and sync
npm run build && npx cap sync

# Run on iOS simulator (requires Xcode)
npx cap run ios

# Run on Android emulator (requires Android Studio)
npx cap run android

# Update plugins
npm update @capacitor/core @capacitor/cli

# Check doctor (verify setup)
npx cap doctor
```

### Plugin Commands
```bash
# List installed plugins
npm list --depth=0 | grep @capacitor

# Add new plugin
npm install @capacitor/plugin-name
npx cap sync

# Remove plugin
npm uninstall @capacitor/plugin-name
npx cap sync
```

---

## 🔧 Configuration Files

### capacitor.config.ts
Main Capacitor configuration - already configured ✅

### android/app/build.gradle
Android build configuration
```gradle
defaultConfig {
    applicationId "com.albassam.hrapp"
    minSdkVersion 22
    targetSdkVersion 33
    versionCode 1
    versionName "1.0.0"
}
```

### ios/App/App/Info.plist
iOS app configuration
```xml
<key>CFBundleDisplayName</key>
<string>مدارس البسام</string>
<key>CFBundleIdentifier</key>
<string>com.albassam.hrapp</string>
```

---

## 📱 Required Assets

### App Icons

**iOS Sizes:**
- 1024x1024 (App Store)
- 180x180 (iPhone)
- 167x167 (iPad)
- 152x152 (iPad)
- 120x120 (iPhone)
- 87x87 (iPhone)
- 80x80 (iPad)
- 76x76 (iPad)
- 60x60 (iPhone)
- 58x58 (iPhone)
- 40x40 (iPad/iPhone)
- 29x29 (iPhone)
- 20x20 (iPad)

**Android Sizes:**
- 512x512 (Play Store)
- 192x192 (xxxhdpi)
- 144x144 (xxhdpi)
- 96x96 (xhdpi)
- 72x72 (hdpi)
- 48x48 (mdpi)

**Tool:** Use https://easyappicon.com or https://makeappicon.com

### Splash Screens

**iOS:**
- Various sizes for different devices
- Portrait & landscape orientations

**Android:**
- Various densities (ldpi to xxxhdpi)
- Portrait & landscape orientations

### Screenshots

**iOS:**
- iPhone 6.7" (1290x2796) - 3-8 screenshots
- iPhone 6.5" (1242x2688) - 3-8 screenshots
- iPad Pro 12.9" (2048x2732) - 3-8 screenshots

**Android:**
- Phone (1080x1920) - 2-8 screenshots
- 7" Tablet - optional
- 10" Tablet - optional

---

## 🔐 Permissions Required

### iOS (Info.plist)
```xml
<!-- Biometric Auth -->
<key>NSFaceIDUsageDescription</key>
<string>نحتاج للتحقق من هويتك لتسجيل الدخول الآمن</string>

<!-- Camera (if needed) -->
<key>NSCameraUsageDescription</key>
<string>نحتاج الكاميرا لتحميل الصور</string>

<!-- Location (if needed) -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>نحتاج موقعك لتسجيل الحضور</string>
```

### Android (AndroidManifest.xml)
```xml
<!-- Internet (required) -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- Biometric -->
<uses-permission android:name="android.permission.USE_BIOMETRIC" />

<!-- Camera (if needed) -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- Location (if needed) -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

---

## 🐛 Troubleshooting

### "Command not found: cap"
```bash
npm install -g @capacitor/cli
```

### iOS build fails
```bash
cd ios/App
pod install
```

### Android build fails
```bash
cd android
./gradlew clean
```

### Sync errors
```bash
rm -rf android ios
npx cap add android
npx cap add ios
npx cap sync
```

---

## 📚 Resources

### Official Docs
- Capacitor: https://capacitorjs.com
- iOS Guide: https://capacitorjs.com/docs/ios
- Android Guide: https://capacitorjs.com/docs/android

### Plugins
- Biometric Auth: https://github.com/aparajita/capacitor-biometric-auth
- Official Plugins: https://capacitorjs.com/docs/plugins

### Tools
- Icon Generator: https://easyappicon.com
- App Store Connect: https://appstoreconnect.apple.com
- Google Play Console: https://play.google.com/console

---

## 💰 Costs Summary

### One-Time
- Google Play Developer: $25 ✅

### Annual
- Apple Developer: $99/year ✅
- Domain: $12/year (existing)

### Total Year 1
**$136**

---

## ⏱️ Timeline

### Phase 1: Setup ✅ COMPLETE (15 minutes)
- Capacitor installation
- iOS/Android projects created
- Plugins installed
- Configuration completed

### Phase 2: Native Configuration (1.5 hours)
- iOS setup in Xcode
- Android setup in Android Studio
- Icons & splash screens
- Permissions

### Phase 3: Biometric Implementation (1-2 hours)
- Auth service
- Login integration
- Testing

### Phase 4: Assets & Store Prep (1-2 days)
- App icons (all sizes)
- Screenshots
- Store listings
- Descriptions

### Phase 5: Testing (2-3 days)
- Internal testing
- Beta testing
- Bug fixes

### Phase 6: Submission (1-2 weeks)
- Developer accounts
- App submissions
- Review process

**Total: 3-4 weeks** 🚀

---

## ✅ Phase 1 Complete!

**What's Done:**
- ✅ Capacitor installed & configured
- ✅ iOS project created
- ✅ Android project created
- ✅ 5 plugins installed
- ✅ Configuration optimized
- ✅ Native projects synced

**Next Session:**
Start Phase 2 - Native configuration (Xcode + Android Studio)

**Estimated Time for Phase 2:** 1-2 hours

---

**Last Updated:** 11 March 2026, 9:25 PM  
**Status:** Ready for Phase 2! 🚀  
**Commit:** Pending (will commit after verification)
