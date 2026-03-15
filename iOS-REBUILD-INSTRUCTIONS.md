# 🍎 iOS Rebuild Instructions - Albassam Platform
### Complete Guide to Fix Info.plist and Upload to TestFlight

---

## ⏱️ **Expected Duration:** 30-45 minutes

---

## ✅ **Prerequisites - Check Before Starting**

Before you begin, ensure you have:

- ✓ **macOS** with **Xcode** installed (latest stable version)
- ✓ **Flutter SDK** installed and in PATH (`flutter --version` should work)
- ✓ **Apple Developer Account** (active membership)
- ✓ **Signing Certificates** configured in Xcode
- ✓ **App ID** registered for `com.albassam.platform` (or your bundle ID)
- ✓ **Provisioning Profiles** downloaded and installed

---

## 📋 **Step-by-Step Rebuild Process**

### **🗂️ Step 1: Navigate to Project Directory**

```bash
cd /data/.openclaw/workspace/mobile/albassam_platform
```

---

### **🧹 Step 2: Clean Previous Build (Deep Clean)**

This removes all cached files and dependencies:

```bash
# Clean Flutter build cache
flutter clean

# Remove iOS-specific caches
cd ios
rm -rf Pods Podfile.lock .symlinks build DerivedData
cd ..

# Re-fetch Flutter dependencies
flutter pub get
```

**⚠️ Important:** If `ios/` directory is empty or missing `Runner/`, run this first:
```bash
flutter create .
```

This regenerates the iOS project structure.

---

### **📄 Step 3: Copy Info.plist to Correct Location**

Now copy the fixed Info.plist template:

```bash
# Copy the template to the correct location
cp ios-Info.plist.template ios/Runner/Info.plist
```

**Verify it worked:**
```bash
ls -lh ios/Runner/Info.plist
```

You should see the file listed with a recent timestamp.

---

### **🔧 Step 4: Install CocoaPods Dependencies**

```bash
cd ios
pod install
cd ..
```

**✅ Success indicators:**
- You should see "Pod installation complete!"
- `ios/Runner.xcworkspace` file should exist

**❌ If you see errors:**
- Try: `cd ios && pod repo update && pod install && cd ..`
- Or: `cd ios && rm -rf Pods && pod install && cd ..`

---

### **🏗️ Step 5: Build iOS App (Release Mode)**

```bash
flutter build ios --release
```

**⏳ This takes 5-10 minutes** - don't worry if it seems slow.

**✅ Success message:**
```
✓ Built ios/Runner.xcodeproj
```

**❌ Common errors:**
- **"No valid code signing"** → Open Xcode, select Team in Signing & Capabilities
- **"Build failed"** → Check logs, might need to clean again

---

### **📦 Step 6: Archive in Xcode**

#### **6.1 Open Workspace**
```bash
open ios/Runner.xcworkspace
```

**⚠️ IMPORTANT:** Open `.xcworkspace`, NOT `.xcodeproj`

---

#### **6.2 Configure Signing (if needed)**

1. Click **Runner** in the left sidebar (blue icon)
2. Select **Runner** under TARGETS
3. Go to **Signing & Capabilities** tab
4. Check **"Automatically manage signing"**
5. Select your **Team** from dropdown
6. Verify **Bundle Identifier** matches your App ID

---

#### **6.3 Select Device Target**

At the top of Xcode:
- Change device from "iPhone Simulator" to **"Any iOS Device (arm64)"**

---

#### **6.4 Create Archive**

1. Menu: **Product** → **Archive**
2. Wait 5-10 minutes for build and archive
3. **Organizer** window will open automatically

**✅ Success:** You'll see your app in the Archives list with today's date

---

### **📤 Step 7: Distribute to App Store Connect**

In the **Organizer** window:

1. Select your archive
2. Click **"Distribute App"**
3. Select **"App Store Connect"**
4. Click **"Next"**
5. Select **"Upload"** (not Export)
6. Click **"Next"**
7. Choose distribution options:
   - ✓ Include bitcode (if available)
   - ✓ Upload symbols
8. Click **"Next"**
9. Re-sign if needed (select automatic)
10. Click **"Upload"**

**⏳ Upload takes 5-15 minutes** depending on internet speed.

**✅ Success message:**
```
"Upload Successful"
```

---

### **🧪 Step 8: Verify in App Store Connect**

#### **8.1 Wait for Processing**

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select **"My Apps"**
3. Select **"Albassam Platform"**
4. Click **"TestFlight"** tab
5. Wait 10-30 minutes for processing

**You'll see:**
- First: "Processing" status
- Then: "Ready to Submit" or "Missing Compliance"

---

#### **8.2 Add to Internal Testers**

1. Under **TestFlight** → **Internal Testing**
2. Click on your test group (or create one)
3. Click **"+"** to add the new build
4. Select the build you just uploaded
5. Click **"Add Build"**

---

#### **8.3 Test Location Permission**

1. Install from TestFlight on your iPhone
2. Open the app
3. Go to **Check In** feature
4. You should see a permission dialog:
   - **"Allow While Using App"**
   - **"Allow Once"**
   - **"Don't Allow"**

**✅ Success criteria:**
- Permission dialog appears
- Text mentions "verify you are checking in from your assigned work location"
- After allowing, Check In works

---

## 🎯 **Success Criteria Checklist**

- ✅ New build appears in App Store Connect
- ✅ TestFlight shows new version number
- ✅ Location permission dialog appears with correct message
- ✅ Check In feature works after granting permission
- ✅ No crashes on launch

---

## 🐛 **Troubleshooting**

### **Problem: CocoaPods Errors**

```bash
# Solution 1: Update CocoaPods
sudo gem install cocoapods

# Solution 2: Clear cache
cd ios
rm -rf Pods Podfile.lock
pod cache clean --all
pod install
cd ..
```

---

### **Problem: Signing Issues**

**Error:** "Failed to create provisioning profile"

**Solution:**
1. Open Xcode → **Preferences** → **Accounts**
2. Select your Apple ID
3. Click **"Download Manual Profiles"**
4. Try archiving again

---

### **Problem: Build Failures**

**Error:** "Command PhaseScriptExecution failed"

**Solution:**
```bash
flutter clean
rm -rf ios/Pods ios/Podfile.lock
flutter pub get
cd ios && pod install && cd ..
flutter build ios --release
```

---

### **Problem: Info.plist Not Found After Copy**

**Error:** "Info.plist could not be found"

**Solution:**
```bash
# Regenerate iOS project first
flutter create .

# Then copy again
cp ios-Info.plist.template ios/Runner/Info.plist
```

---

### **Problem: Archive Grayed Out**

**Issue:** Product → Archive is disabled

**Solution:**
- Ensure you selected **"Any iOS Device (arm64)"** at the top
- Not a simulator device
- Build must succeed first

---

### **Problem: Upload Stuck**

**Issue:** Upload hangs at "Verifying assets"

**Solution:**
1. Cancel upload
2. Check internet connection
3. Try again (sometimes Apple servers are slow)
4. Try uploading via **Xcode → Organizer** → Right-click archive → **"Upload to App Store Connect"**

---

## 📱 **Testing Checklist After Upload**

Once installed from TestFlight:

1. ✅ App launches without crash
2. ✅ Location permission dialog appears
3. ✅ Dialog text is clear and in English/Arabic
4. ✅ Check In works after granting permission
5. ✅ GPS detects location correctly
6. ✅ No permission errors in logs

---

## 📞 **Need Help?**

If stuck:
1. Check Xcode logs for specific error messages
2. Check Flutter logs: `flutter doctor -v`
3. Verify signing: `cd ios && xcodebuild -list`
4. Check Apple Developer portal for provisioning profile status

---

## 🎉 **You're Done!**

Once TestFlight shows the new build and location permission works:
- ✅ Info.plist is correctly configured
- ✅ App is ready for external testing
- ✅ Ready to submit for App Review

**Next Steps:**
- Test thoroughly with internal testers
- Add external testers if needed
- Submit for App Review when ready

---

**Created:** 2026-03-15  
**Project:** Albassam Platform  
**Purpose:** Fix missing location permissions in Info.plist

---

## 🌍 **Arabic Notes - ملاحظات بالعربية**

**الخطوات الأساسية:**
1. تنظيف المشروع - `flutter clean`
2. نسخ ملف Info.plist - `cp ios-Info.plist.template ios/Runner/Info.plist`
3. بناء التطبيق - `flutter build ios --release`
4. الأرشفة في Xcode - Product → Archive
5. الرفع إلى App Store Connect
6. التحقق من ظهور رسالة الموقع

**الوقت المتوقع:** ٣٠-٤٥ دقيقة

**معايير النجاح:**
- ظهور رسالة طلب الموقع عند فتح ميزة تسجيل الحضور
- عمل التطبيق بدون أخطاء
- ظهور النسخة الجديدة في TestFlight

---

Good luck! 🚀
