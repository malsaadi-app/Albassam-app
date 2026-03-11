# 🍎 iOS App Store Submission Guide

**Project:** مدارس البسام - نظام الموارد البشرية  
**App ID:** com.albassam.hrapp  
**Target:** Apple App Store  
**Date:** 11 March 2026

---

## 📋 Prerequisites Checklist

### **Requirements:**
- [ ] ✅ **macOS device** (Mac, MacBook, iMac, or Mac Mini)
- [ ] ✅ **Xcode installed** (latest version from App Store)
- [ ] 💰 **Apple Developer Account** ($99/year)
- [ ] 🎨 **App icons** (all sizes)
- [ ] 📸 **Screenshots** (3-8 per device size)
- [ ] 📝 **App description** (Arabic + English)
- [ ] 📄 **Privacy Policy URL**
- [ ] 📧 **Support email/URL**

**Status:** Configuration ✅ | Assets ⏸️ | Account ⏸️

---

## 🎯 Step-by-Step Process

### **Phase 1: Apple Developer Account** (1-2 days)

#### **1.1 Enroll in Apple Developer Program**

**URL:** https://developer.apple.com/programs/enroll/

**Steps:**
1. Sign in with Apple ID
2. Choose account type:
   - **Individual** (شخصي) - Faster, your name only
   - **Organization** (شركة/مؤسسة) - Needs D-U-N-S number
3. Pay $99 USD
4. Wait for approval (1-2 days)

**Recommendation:** Start with Individual for faster approval

#### **1.2 What You Get:**
- ✅ Access to App Store Connect
- ✅ Xcode signing certificates
- ✅ TestFlight for beta testing
- ✅ App analytics
- ✅ Support resources

**Cost:** $99/year (renews automatically)

---

### **Phase 2: App Icons** (2-4 hours)

#### **Required Sizes for iOS:**

```
App Store (Required):
📱 1024x1024 - App Store icon (PNG, no alpha)

iPhone (Required):
📱 180x180 (@3x) - iPhone Pro/Plus/Max
📱 120x120 (@2x) - Standard iPhone
📱 87x87 (@3x) - Settings
📱 80x80 (@2x) - Settings
📱 60x60 (@2x) - Spotlight
📱 58x58 (@2x) - Settings
📱 40x40 (@2x) - Spotlight

iPad (Optional):
📱 167x167 (@2x) - iPad Pro
📱 152x152 (@2x) - iPad
📱 76x76 - iPad
📱 29x29 - Settings
📱 20x20 - Notifications
```

#### **Design Guidelines:**

**Do's ✅**
- Simple, recognizable design
- Works at small sizes
- Brand colors (#1D0B3E - purple theme)
- No text (icon should be self-explanatory)
- Square with rounded corners (iOS adds automatically)

**Don'ts ❌**
- No transparency (alpha channel)
- No rounded corners (iOS does this)
- No screenshots
- No complex details

#### **Quick Design Ideas:**

**Option 1: Simple Logo + Background**
```
Background: #1D0B3E (brand purple)
Icon: School/HR symbol (white)
Style: Flat, modern
```

**Option 2: Letter Badge**
```
Letter: ب (Ba from Bassam)
Background: Gradient purple
Border: Gold accent
```

**Option 3: Building/School Icon**
```
Icon: Stylized school building
Colors: Purple + white
Style: Minimalist
```

#### **Tools:**

**Online Generators (Easiest):**
1. **Icon Kitchen** - https://icon.kitchen/
   - Upload 1024x1024
   - Generates all sizes
   - Free ✅

2. **App Icon Generator** - https://www.appicon.co/
   - Upload master icon
   - Download iOS pack
   - Free ✅

3. **MakeAppIcon** - https://makeappicon.com/
   - Upload design
   - Get all sizes
   - Free ✅

**Design Tools:**
- **Figma** (free) - https://figma.com
- **Canva** (free) - https://canva.com
- **Photoshop** (paid)

#### **Current Status:**
⚠️ Using default Capacitor icons
🎯 **ACTION REQUIRED:** Design and generate icons

---

### **Phase 3: Screenshots** (1-2 hours)

#### **Required Sizes:**

**iPhone 6.7" (iPhone 14/15 Pro Max)** - REQUIRED
- Resolution: 1290 x 2796 pixels
- Count: 3-8 screenshots
- Orientation: Portrait

**iPhone 6.5" (iPhone 11/12/13 Pro Max)** - REQUIRED
- Resolution: 1242 x 2688 pixels
- Count: 3-8 screenshots
- Orientation: Portrait

**iPhone 5.5" (iPhone 8 Plus)** - Optional
- Resolution: 1242 x 2208 pixels
- Count: 3-8 screenshots

**iPad Pro 12.9"** - Optional
- Resolution: 2048 x 2732 pixels
- Count: 3-8 screenshots

#### **Recommended Screenshots (Order matters!):**

1. **Login Screen** - With Face ID button
   - Title: "تسجيل دخول سريع وآمن"
   - Highlight: Face ID feature

2. **Dashboard** - Main overview
   - Title: "لوحة التحكم الشاملة"
   - Highlight: Stats cards, quick actions

3. **Attendance** - Check-in feature
   - Title: "تسجيل الحضور والغياب"
   - Highlight: Easy attendance tracking

4. **Payroll** - Salary view
   - Title: "كشوف الرواتب التفصيلية"
   - Highlight: Transparent salary breakdown

5. **Requests** - Leave/HR requests
   - Title: "إدارة الطلبات الإلكترونية"
   - Highlight: Fast approvals

6. **Analytics** - Reports/Dashboard
   - Title: "تقارير وتحليلات متقدمة"
   - Highlight: Real-time insights

7. **Profile** - Employee profile
   - Title: "ملف الموظف الشامل"
   - Highlight: All information in one place

8. **Settings** - App settings
   - Title: "إعدادات مرنة"
   - Highlight: Customization options

#### **How to Take Screenshots:**

**Option A: From Xcode Simulator**
```bash
1. Open Xcode
2. Run app in simulator
3. Device → iPhone 15 Pro Max
4. Navigate to screen
5. Cmd + S to save screenshot
6. Repeat for all screens
```

**Option B: Design in Figma/Photoshop**
```
1. Create artboard with exact size
2. Add screenshot of app
3. Add title text
4. Add highlighting (optional)
5. Export as PNG
```

**Option C: Use App Store Screenshot Template**
- Download free templates
- Insert your app screens
- Add text overlays
- Export in correct sizes

#### **Tools:**
- **Xcode Simulator** (free, built-in)
- **Figma** (free)
- **Screenshot Maker** - https://appscreenmaker.com/ (paid)
- **DaVinci** - https://www.davinciapps.com/ (paid)

---

### **Phase 4: App Store Listing Content** (30 minutes)

#### **App Name** (30 characters max)
```
Arabic: مدارس البسام - الموارد البشرية
English: Albassam Schools HR
```

**Recommendation:** Use Arabic as primary (target audience)

#### **Subtitle** (30 characters max)
```
Arabic: إدارة الموظفين والحضور
English: Employee & Attendance System
```

#### **Description** (4000 characters max)

**Arabic Version:**
```markdown
نظام البسام لإدارة الموارد البشرية والمهام اليومية

نظام شامل ومتكامل لإدارة الموظفين والحضور والرواتب، مصمم خصيصاً للمدارس والمؤسسات التعليمية.

🌟 المميزات الرئيسية:

✅ تسجيل الدخول السريع
• Face ID و Touch ID
• دخول آمن ومشفر
• حفظ بيانات الدخول

✅ إدارة الموظفين
• ملفات الموظفين الكاملة
• التعيينات والنقل
• الوثائق والمستندات
• السجلات التاريخية

✅ الحضور والغياب
• تسجيل الحضور اليومي
• تصحيح الحضور
• طلبات الأعذار
• التقارير التفصيلية

✅ طلبات الإجازات
• طلب إجازة بضغطة زر
• متابعة حالة الطلب
• تاريخ الإجازات
• الرصيد المتبقي

✅ كشوف الرواتب
• عرض الراتب الشهري
• تفاصيل الإضافات والخصومات
• تحميل PDF
• السجل التاريخي

✅ نظام الموافقات
• موافقة الطلبات الإلكترونية
• إشعارات فورية
• تعليقات وملاحظات
• تتبع المراحل

✅ التقارير والتحليلات
• لوحة تحكل شاملة
• إحصائيات مباشرة
• رسوم بيانية
• تقارير قابلة للتصدير

✅ الإشعارات
• إشعارات فورية (Push)
• تنبيهات المهام
• تحديثات الطلبات
• رسائل النظام

🎯 لمن هذا التطبيق؟

✓ المدارس والجامعات
✓ المؤسسات التعليمية
✓ الشركات والمنظمات
✓ الجهات الحكومية

🔒 الأمان والخصوصية

• تشفير شامل للبيانات
• مصادقة ثنائية
• نسخ احتياطي تلقائي
• امتثال كامل للخصوصية

📱 واجهة سهلة ومريحة

• تصميم عربي أصيل (RTL)
• ألوان مريحة للعين
• سهل الاستخدام
• استجابة سريعة

💬 الدعم الفني

نحن هنا لمساعدتك! فريق الدعم متواجد للرد على استفساراتك وحل أي مشكلة.

📧 التواصل: support@albassam-app.com

---

تطبيق البسام - حلول موارد بشرية متكاملة
```

**English Version:**
```markdown
Albassam HR & Employee Management System

A comprehensive human resources and daily operations management system, designed specifically for schools and educational institutions.

🌟 Key Features:

✅ Quick & Secure Login
• Face ID & Touch ID
• Encrypted authentication
• Secure credential storage

✅ Employee Management
• Complete employee profiles
• Assignments & transfers
• Documents & files
• Historical records

✅ Attendance Tracking
• Daily attendance logging
• Attendance corrections
• Excuse requests
• Detailed reports

✅ Leave Requests
• One-tap leave request
• Request status tracking
• Leave history
• Balance overview

✅ Payroll
• Monthly salary view
• Additions & deductions breakdown
• PDF download
• Historical records

✅ Approval System
• Electronic request approvals
• Instant notifications
• Comments & notes
• Stage tracking

✅ Reports & Analytics
• Comprehensive dashboard
• Real-time statistics
• Charts & graphs
• Exportable reports

✅ Notifications
• Push notifications
• Task alerts
• Request updates
• System messages

🎯 Who Is This For?

✓ Schools & universities
✓ Educational institutions
✓ Companies & organizations
✓ Government entities

🔒 Security & Privacy

• End-to-end encryption
• Two-factor authentication
• Automatic backups
• Full privacy compliance

📱 Easy & Comfortable Interface

• Native Arabic design (RTL)
• Eye-friendly colors
• User-friendly
• Fast response

💬 Technical Support

We're here to help! Our support team is available to answer your questions and solve any issues.

📧 Contact: support@albassam-app.com

---

Albassam App - Integrated HR Solutions
```

#### **Keywords** (100 characters max)
```
Arabic:
موارد بشرية,حضور,رواتب,إجازات,موظفين,مدارس,إدارة,تعليم

English:
hr,attendance,payroll,leave,employees,school,management,education
```

#### **Promotional Text** (170 characters max)
```
Arabic:
نظام شامل لإدارة الموظفين والحضور والرواتب. دخول سريع بـ Face ID، إشعارات فورية، تقارير تفصيلية. مصمم للمدارس والمؤسسات التعليمية.

English:
Comprehensive employee, attendance & payroll management. Fast Face ID login, instant notifications, detailed reports. Built for schools & educational institutions.
```

---

### **Phase 5: Privacy Policy & Support** (1 hour)

#### **Privacy Policy (REQUIRED)**

**URL Needed:** https://albassam-app.com/privacy

**Must Include:**
1. What data we collect
2. How we use the data
3. Data storage & security
4. Third-party services (if any)
5. User rights
6. Contact information

**Quick Template:**
```markdown
# Privacy Policy - Albassam HR App

Last updated: March 11, 2026

## Data Collection
We collect:
- Employee information (name, ID, contact)
- Attendance records
- Payroll information
- App usage data

## Data Usage
Your data is used only for:
- HR management
- Attendance tracking
- Payroll processing
- Reporting

## Data Security
- Encrypted storage
- Secure transmission
- Access controls
- Regular backups

## User Rights
You have the right to:
- Access your data
- Request corrections
- Delete your account
- Export your data

## Contact
support@albassam-app.com
```

#### **Support URL**
```
https://albassam-app.com/support
```

#### **Marketing URL** (optional)
```
https://albassam-app.com
```

**ACTION REQUIRED:** Create these pages on your website

---

### **Phase 6: Build & Archive in Xcode** (30-60 minutes)

#### **6.1 Open Project in Xcode**

```bash
cd /path/to/albassam-tasks
npx cap open ios
```

This will open the iOS project in Xcode.

#### **6.2 Configure Signing**

In Xcode:
1. Select project root → "Signing & Capabilities"
2. **Team:** Select your Apple Developer account
3. **Bundle Identifier:** com.albassam.hrapp (already set ✅)
4. **Signing Certificate:** Automatic
5. Check "Automatically manage signing"

#### **6.3 Set Version & Build Number**

1. Select project → General
2. **Version:** 1.0.0
3. **Build:** 1

#### **6.4 Add App Icons**

1. Open `ios/App/App/Assets.xcassets/AppIcon.appiconset`
2. Drag and drop all icon sizes
3. Make sure 1024x1024 is included

#### **6.5 Configure Capabilities** (if needed)

1. Signing & Capabilities → "+" button
2. Add:
   - Push Notifications (if using)
   - Background Modes (if needed)

#### **6.6 Build & Archive**

```
1. Select "Any iOS Device (arm64)" as target
2. Product → Archive
3. Wait for build to complete (2-5 minutes)
4. Archives window opens
```

**Troubleshooting:**
- If build fails: Check code signing settings
- Missing provisioning profile: Re-select team
- Swift errors: Run `pod install` in ios/App folder

---

### **Phase 7: Upload to App Store Connect** (15-30 minutes)

#### **7.1 Create App in App Store Connect**

**URL:** https://appstoreconnect.apple.com

Steps:
1. Sign in with Apple Developer account
2. My Apps → "+" → New App
3. Platform: iOS
4. Name: مدارس البسام
5. Primary Language: Arabic
6. Bundle ID: com.albassam.hrapp
7. SKU: ALBASSAM-HR-001
8. User Access: Full Access
9. Click "Create"

#### **7.2 Fill App Information**

**App Information Tab:**
- Name: مدارس البسام
- Subtitle: إدارة الموظفين والحضور
- Privacy Policy URL: https://albassam-app.com/privacy
- Category: Business (Primary), Productivity (Secondary)
- Content Rights: (check if applicable)

**Pricing and Availability:**
- Price: Free
- Availability: All countries (or select specific)

#### **7.3 Prepare for Submission**

**Version Information (1.0):**
- Screenshots: Upload all required sizes
- Promotional Text: (optional, 170 chars)
- Description: Full app description
- Keywords: موارد بشرية,حضور,رواتب...
- Support URL: https://albassam-app.com/support
- Marketing URL: (optional)

**Build:**
- Select the uploaded build from Xcode

**General App Information:**
- App Icon: 1024x1024 (upload separately)
- Age Rating: 4+ (recommended)
- Copyright: 2026 Albassam Schools

**App Review Information:**
- Contact: Your email & phone
- Demo Account: (REQUIRED if app needs login)
  - Username: demo@test.com
  - Password: TestDemo123!
- Notes: "This app requires employee credentials from Albassam Schools"

#### **7.4 Submit for Review**

1. Review all information
2. Click "Add for Review"
3. Click "Submit to App Review"
4. Wait for review (1-3 days typically)

---

### **Phase 8: TestFlight (Optional but Recommended)** (1 week)

Before full release, test with real users:

#### **8.1 Internal Testing**

1. App Store Connect → TestFlight
2. Internal Testing → Add testers
3. Enter emails (up to 100)
4. Testers receive invitation
5. They install TestFlight app
6. Accept invitation
7. Download and test

**Duration:** 1-2 days

#### **8.2 External Testing**

1. Create External group
2. Add up to 10,000 testers
3. Requires App Review approval
4. Public link option available

**Duration:** 1 week recommended

#### **8.3 Collect Feedback**

- Crashes
- UI/UX issues
- Performance problems
- Feature requests

**Fix issues → Upload new build → Repeat**

---

## 📋 Complete Checklist

### **Before Starting:**
- [ ] Apple Developer account enrolled ($99 paid)
- [ ] macOS device with Xcode installed
- [ ] App icons designed (all sizes)
- [ ] Screenshots captured (all required sizes)
- [ ] Privacy Policy page created
- [ ] Support page created
- [ ] Demo account credentials ready

### **In Xcode:**
- [ ] Project opened successfully
- [ ] Code signing configured
- [ ] App icons added
- [ ] Version & build number set
- [ ] Capabilities configured
- [ ] Archive built successfully
- [ ] Build uploaded to App Store Connect

### **In App Store Connect:**
- [ ] App created
- [ ] App name & subtitle set
- [ ] Description written (Arabic + English)
- [ ] Keywords added
- [ ] Screenshots uploaded (all sizes)
- [ ] Privacy Policy URL added
- [ ] Support URL added
- [ ] Category selected
- [ ] Pricing set (Free)
- [ ] Age rating configured
- [ ] Demo account provided
- [ ] Build selected
- [ ] Submitted for review

### **Post-Submission:**
- [ ] Review status: "Waiting for Review"
- [ ] Monitor status daily
- [ ] Respond to any questions within 24h
- [ ] Fix any rejection issues
- [ ] Celebrate when "Ready for Sale"! 🎉

---

## ⏱️ Timeline Estimate

```
Day 1: Apple Developer enrollment (1-2 days wait)
Day 2-3: Design app icons (2-4 hours)
Day 3-4: Capture screenshots (1-2 hours)
Day 4: Create privacy policy page (1 hour)
Day 5: Build & archive in Xcode (1 hour)
Day 5: Create app in App Store Connect (30 min)
Day 5: Upload and submit (1 hour)
Day 6-8: App Review (1-3 days)
Day 9: App approved! 🎉

Total: 7-10 days
```

---

## 💰 Total Cost

```
Apple Developer Account:  $99/year
Domain (existing):        $12/year
Design tools (optional):  $0-50
────────────────────────────────
Total:                    $111-161
```

---

## 🆘 Common Issues & Solutions

### **Issue: "No signing certificate"**
**Solution:** 
1. Xcode → Preferences → Accounts
2. Select Apple ID
3. Download Manual Profiles
4. Try archive again

### **Issue: "Build failed"**
**Solution:**
```bash
cd ios/App
pod install
pod update
```

### **Issue: "Missing privacy usage description"**
**Solution:** Already added to Info.plist ✅

### **Issue: "App rejected - Guideline 2.1"**
**Solution:** 
- Make sure app works without crashing
- Provide working demo account
- Add screenshots showing functionality

### **Issue: "App rejected - Guideline 4.0"**
**Solution:**
- Ensure design follows iOS guidelines
- Remove any Apple logo/iconography
- Use system fonts and icons

---

## 📞 Support Resources

- **App Store Connect:** https://appstoreconnect.apple.com
- **Developer Portal:** https://developer.apple.com
- **TestFlight:** https://testflight.apple.com
- **App Review Guidelines:** https://developer.apple.com/app-store/review/guidelines/
- **Human Interface Guidelines:** https://developer.apple.com/design/human-interface-guidelines/

---

## 🎉 After Approval

Once app is approved:

1. **App goes live** automatically (or set release date)
2. **Monitor analytics** in App Store Connect
3. **Respond to reviews** (important!)
4. **Collect feedback** from users
5. **Plan updates** based on feedback
6. **Submit update builds** as needed

**Marketing:**
- Share App Store link
- Announce in company
- Email employees
- Social media posts

**App Store Link Format:**
```
https://apps.apple.com/app/id[APP_ID]
```

---

**Last Updated:** 11 March 2026, 9:45 PM  
**Status:** Ready to start! 🚀  
**Next Step:** Enroll in Apple Developer Program
