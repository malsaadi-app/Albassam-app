# ✅ Pre-Launch Checklist - تطبيق البسام

**آخر تحديث:** 23 فبراير 2026

---

## 🔴 Phase 1: الأمان والاستقرار (Week 1)

### Database Migration
- [ ] **Setup PostgreSQL instance**
  - [ ] Create Supabase account (أو Railway)
  - [ ] Create new database
  - [ ] Get connection string
  - [ ] Test connectivity

- [ ] **Migration script**
  ```bash
  # 1. Export current SQLite data
  npx prisma db pull
  
  # 2. Update .env with PostgreSQL URL
  DATABASE_URL="postgresql://..."
  
  # 3. Generate new migration
  npx prisma migrate dev --name postgres_migration
  
  # 4. Seed data
  npm run seed
  
  # 5. Test all features
  ```

- [ ] **Backup strategy**
  - [ ] Setup daily automated backups
  - [ ] Configure retention (30 days)
  - [ ] Test restore process
  - [ ] Document procedure

### Security Hardening
- [ ] **Rate limiting**
  ```typescript
  // middleware.ts
  import rateLimit from 'express-rate-limit'
  
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  })
  ```

- [ ] **Security headers**
  ```typescript
  // next.config.ts
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
      ]
    }
  ]
  ```

- [ ] **Input validation**
  - [ ] Add zod validation لكل API
  - [ ] Sanitize user inputs
  - [ ] File upload validation (size, type)
  - [ ] SQL injection prevention check

- [ ] **Environment variables**
  - [ ] Move secrets to .env
  - [ ] Remove hardcoded passwords
  - [ ] Setup production .env
  - [ ] Document all variables

### SSL & HTTPS
- [ ] **Verify Cloudflare SSL**
  - [ ] Check SSL certificate
  - [ ] Force HTTPS redirect
  - [ ] Test on all domains
  - [ ] Update CORS settings

---

## 🔴 Phase 2: الأداء (Week 2)

### Caching Layer
- [ ] **Redis setup**
  ```bash
  npm install ioredis
  ```
  
- [ ] **Implement caching**
  ```typescript
  // lib/redis.ts
  import Redis from 'ioredis'
  
  const redis = new Redis(process.env.REDIS_URL)
  
  // Cache frequently accessed data
  - [ ] User sessions
  - [ ] Dashboard stats
  - [ ] Employee lists
  - [ ] Branch data
  ```

- [ ] **Cache invalidation**
  - [ ] On data updates
  - [ ] TTL configuration
  - [ ] Cache warming strategy

### Image Optimization
- [ ] **Convert to Next/Image**
  ```typescript
  // Replace all <img> with
  import Image from 'next/image'
  
  <Image 
    src="/logo.jpg"
    width={200}
    height={100}
    alt="Logo"
    priority
  />
  ```

- [ ] **Image formats**
  - [ ] Convert large images to WebP
  - [ ] Optimize PNG/JPG (TinyPNG)
  - [ ] Setup Cloudflare Images (CDN)
  - [ ] Lazy loading للصور

### Code Optimization
- [ ] **Bundle analysis**
  ```bash
  npm install @next/bundle-analyzer
  # Check bundle size
  ANALYZE=true npm run build
  ```

- [ ] **Dynamic imports**
  ```typescript
  // Heavy components
  const Chart = dynamic(() => import('./Chart'), {
    loading: () => <Skeleton />,
    ssr: false
  })
  ```

- [ ] **Code splitting**
  - [ ] Split vendor bundles
  - [ ] Route-based splitting
  - [ ] Component lazy loading

### Database Optimization
- [ ] **Add indexes**
  ```prisma
  model Employee {
    @@index([username])
    @@index([email])
    @@index([branchId])
    @@index([status])
  }
  ```

- [ ] **Query optimization**
  - [ ] Use select لتحديد الحقول
  - [ ] Pagination للقوائم الطويلة
  - [ ] Connection pooling
  - [ ] Analyze slow queries

---

## 🟡 Phase 3: Monitoring (3-4 days)

### Error Tracking
- [ ] **Sentry setup**
  ```bash
  npm install @sentry/nextjs
  npx @sentry/wizard -i nextjs
  ```

- [ ] **Configuration**
  ```typescript
  // sentry.config.js
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV
  })
  ```

- [ ] **Error boundaries**
  ```typescript
  // app/error.tsx
  'use client'
  export default function Error({ error, reset }) {
    return (
      <div>
        <h2>حدث خطأ</h2>
        <button onClick={reset}>حاول مرة أخرى</button>
      </div>
    )
  }
  ```

### Logging
- [ ] **Winston setup**
  ```bash
  npm install winston
  ```

- [ ] **Structured logs**
  ```typescript
  // lib/logger.ts
  import winston from 'winston'
  
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' })
    ]
  })
  ```

- [ ] **Log important events**
  - [ ] User login/logout
  - [ ] Data modifications
  - [ ] API errors
  - [ ] Security events

### Analytics
- [ ] **Setup analytics**
  ```bash
  npm install @vercel/analytics
  # OR
  npm install plausible-tracker
  ```

- [ ] **Track events**
  - [ ] Page views
  - [ ] User actions
  - [ ] Feature usage
  - [ ] Errors

### Health Checks
- [ ] **Uptime monitoring**
  - [ ] UptimeRobot account
  - [ ] Add https://app.albassam-app.com/api/health
  - [ ] Configure alerts (email/SMS)
  - [ ] Check every 5 minutes

- [ ] **Performance monitoring**
  - [ ] Response time tracking
  - [ ] Database query time
  - [ ] API endpoint performance
  - [ ] Resource usage (CPU, RAM)

---

## 🟡 Phase 4: UX Improvements (Week 3)

### Loading States
- [ ] **Skeleton loaders**
  ```typescript
  // components/Skeleton.tsx
  export function Skeleton() {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    )
  }
  ```

- [ ] **Add to all pages**
  - [ ] Dashboard
  - [ ] Lists
  - [ ] Forms
  - [ ] Details pages

### Error Handling
- [ ] **User-friendly errors**
  ```typescript
  // التطبيق توقف مؤقتاً ← حدث خطأ غير متوقع
  // 404 → الصفحة غير موجودة
  // 403 → غير مصرح
  // 500 → خطأ في الخادم
  ```

- [ ] **Recovery options**
  - [ ] Retry button
  - [ ] Go back button
  - [ ] Support contact
  - [ ] Report issue

### Empty States
- [ ] **Design empty states**
  - [ ] Illustration أو icon
  - [ ] Helpful message
  - [ ] Call-to-action
  - [ ] Onboarding hint

- [ ] **Add to all lists**
  - [ ] Employees
  - [ ] Tasks
  - [ ] Requests
  - [ ] Reports

### Notifications
- [ ] **Push notifications**
  ```typescript
  // app/api/push/subscribe/route.ts
  // Already exists - test it
  ```

- [ ] **Email notifications**
  - [ ] Setup SendGrid أو Resend
  - [ ] Templates للإشعارات
  - [ ] Queue system (Bull)
  - [ ] Unsubscribe option

- [ ] **In-app notifications**
  - [ ] Notification center
  - [ ] Real-time updates
  - [ ] Mark as read
  - [ ] Badge counts

### Help & Guidance
- [ ] **Tooltips**
  ```typescript
  // Use shadcn/ui Tooltip
  npm install @radix-ui/react-tooltip
  ```

- [ ] **Onboarding tour**
  ```bash
  npm install react-joyride
  ```

- [ ] **Help center**
  - [ ] FAQs page
  - [ ] Video tutorials
  - [ ] Contact support
  - [ ] WhatsApp link

---

## 🟡 Phase 5: Testing (Week 4)

### Automated Testing
- [ ] **Setup Vitest**
  ```bash
  npm install -D vitest @testing-library/react
  ```

- [ ] **Unit tests**
  - [ ] Utils functions
  - [ ] API helpers
  - [ ] Prisma queries
  - [ ] Target: 50% coverage

- [ ] **Integration tests**
  ```typescript
  // __tests__/api/auth.test.ts
  describe('Auth API', () => {
    it('should login with valid credentials', async () => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'test', password: 'test' })
      })
      expect(res.status).toBe(200)
    })
  })
  ```

- [ ] **E2E testing**
  ```bash
  npm install -D @playwright/test
  ```

### Manual Testing
- [ ] **Cross-browser**
  - [ ] Chrome (desktop)
  - [ ] Safari (desktop)
  - [ ] Firefox (desktop)
  - [ ] Chrome (mobile)
  - [ ] Safari (iOS)

- [ ] **Devices**
  - [ ] iPhone 14 Pro
  - [ ] iPad Pro
  - [ ] Android phone
  - [ ] Desktop (1920x1080)
  - [ ] Laptop (1366x768)

- [ ] **Critical flows**
  - [ ] Login/Logout
  - [ ] Create employee
  - [ ] Mark attendance
  - [ ] Create task
  - [ ] Approve request
  - [ ] Generate report

### Performance Testing
- [ ] **Load testing**
  ```bash
  # Use k6 or Artillery
  npm install -g artillery
  
  # Test 100 concurrent users
  artillery quick --count 100 --num 10 https://app.albassam-app.com
  ```

- [ ] **Metrics to check**
  - [ ] Response time < 2s
  - [ ] No memory leaks
  - [ ] Database connections stable
  - [ ] CPU usage < 70%

### Security Testing
- [ ] **OWASP Top 10**
  - [ ] SQL Injection
  - [ ] XSS
  - [ ] CSRF
  - [ ] Authentication bypass
  - [ ] Authorization issues

- [ ] **Vulnerability scan**
  ```bash
  # Run npm audit
  npm audit
  npm audit fix
  ```

---

## 🟢 Phase 6: Documentation (3-4 days)

### User Documentation
- [ ] **User manual (PDF)**
  - [ ] Getting started
  - [ ] Features overview
  - [ ] Step-by-step guides
  - [ ] Screenshots
  - [ ] Troubleshooting

- [ ] **Video tutorials**
  - [ ] Login & navigation
  - [ ] Employee management
  - [ ] Attendance marking
  - [ ] Creating requests
  - [ ] Reports generation

- [ ] **FAQs**
  ```markdown
  ## الأسئلة الشائعة
  
  ### كيف أغير كلمة المرور؟
  1. اضغط على الملف الشخصي
  2. اختر "تغيير كلمة المرور"
  3. ...
  ```

### Admin Documentation
- [ ] **Deployment guide**
  ```markdown
  # نشر التطبيق
  
  ## المتطلبات
  - Node.js 18+
  - PostgreSQL 14+
  - PM2
  
  ## الخطوات
  1. Clone repository
  2. npm install
  3. Setup .env
  4. ...
  ```

- [ ] **Configuration guide**
  - [ ] Environment variables
  - [ ] Database setup
  - [ ] Backup configuration
  - [ ] SSL setup

- [ ] **Troubleshooting**
  - [ ] Common errors
  - [ ] Solutions
  - [ ] Support contacts

### Developer Documentation
- [ ] **API documentation**
  ```bash
  # Use Swagger
  npm install swagger-ui-express
  ```

- [ ] **Code documentation**
  - [ ] Add JSDoc comments
  - [ ] Type definitions
  - [ ] Examples

- [ ] **Architecture**
  ```markdown
  # Architecture Overview
  
  ## Tech Stack
  - Frontend: Next.js 15 + React 19
  - Backend: Next.js API Routes
  - Database: PostgreSQL + Prisma
  - Cache: Redis
  - Deployment: PM2 + Docker
  ```

---

## 🔴 Phase 7: Soft Launch (Week 5-6)

### Beta Testing
- [ ] **Select beta testers**
  - [ ] 10-20 users من المدارس
  - [ ] Mix of roles (admin, HR, teacher)
  - [ ] Different branches

- [ ] **Setup feedback system**
  ```typescript
  // Feedback form in app
  // OR Google Forms link
  // OR WhatsApp group
  ```

- [ ] **Collect feedback**
  - [ ] Daily check-ins
  - [ ] Bug reports
  - [ ] Feature requests
  - [ ] UX issues

### Gradual Rollout
- [ ] **Week 1: One branch**
  - [ ] مجمع البسام الأهلية بنين
  - [ ] Train admins
  - [ ] Monitor closely
  - [ ] Fix critical bugs

- [ ] **Week 2: Two more branches**
  - [ ] Add branches بنات + العالمية
  - [ ] Compare performance
  - [ ] Gather more feedback

- [ ] **Week 3: All branches**
  - [ ] Full rollout
  - [ ] Announce officially
  - [ ] Celebrate! 🎉

### Monitoring
- [ ] **24/7 first week**
  - [ ] Check errors every 2 hours
  - [ ] Response time < 1 hour
  - [ ] Fix critical bugs same day

- [ ] **Daily reports**
  ```markdown
  # Daily Report - Day 1
  
  ## Metrics
  - Active users: 45
  - Requests: 1,234
  - Errors: 2 (fixed)
  - Avg response time: 1.2s
  
  ## Issues
  - Login slow on mobile (fixed)
  - Report generation timeout (investigating)
  
  ## Tomorrow
  - Monitor report generation
  - Add more loading indicators
  ```

---

## 📱 App Store Submission (Week 7-10)

### Preparation (Week 7)
- [ ] **Apple Developer Account**
  - [ ] Sign up ($99/year)
  - [ ] Verify identity
  - [ ] Accept agreements

- [ ] **App metadata**
  - [ ] App name: "مدارس البسام"
  - [ ] Subtitle: "نظام إدارة المدارس"
  - [ ] Description (4000 chars):
    ```
    نظام شامل لإدارة المدارس يتضمن:
    ✓ إدارة الموظفين والحضور
    ✓ المهام والطلبات
    ✓ الرواتب والتقارير
    ✓ ...
    ```
  - [ ] Keywords: مدارس, تعليم, إدارة, موظفين, حضور
  - [ ] Categories: Education, Productivity
  - [ ] Age rating: 4+

- [ ] **Screenshots (required)**
  - [ ] iPhone 6.7" (1290 x 2796):
    - [ ] Login screen
    - [ ] Dashboard
    - [ ] Employee list
    - [ ] Attendance
    - [ ] Reports
  - [ ] iPhone 5.5" (1242 x 2208):
    - [ ] Same 5 screens
  - [ ] iPad Pro 12.9" (2048 x 2732):
    - [ ] Same 5 screens

- [ ] **App icon**
  - [ ] 1024x1024 PNG
  - [ ] No transparency
  - [ ] No rounded corners (Apple adds them)

- [ ] **Privacy policy**
  ```markdown
  # سياسة الخصوصية
  
  ## جمع البيانات
  نجمع:
  - معلومات الموظفين
  - سجلات الحضور
  - ...
  
  ## استخدام البيانات
  ...
  
  ## الأمان
  ...
  ```
  - [ ] Host على /privacy-policy
  - [ ] Or use Termly/TermsFeed generator

- [ ] **Terms of service**
  - [ ] Host على /terms
  - [ ] Or use template

### Development (Week 8)
- [ ] **Capacitor setup**
  ```bash
  # 1. Install
  npm install @capacitor/core @capacitor/cli
  npm install @capacitor/ios @capacitor/android
  npm install @capacitor/push-notifications
  npm install @capacitor/splash-screen
  npm install @capacitor/status-bar
  
  # 2. Initialize
  npx cap init "مدارس البسام" "com.albassam.schools"
  
  # 3. Build web
  npm run build
  
  # 4. Add iOS
  npx cap add ios
  
  # 5. Copy web assets
  npx cap sync
  ```

- [ ] **iOS configuration**
  ```swift
  // ios/App/App/capacitor.config.json
  {
    "appId": "com.albassam.schools",
    "appName": "مدارس البسام",
    "webDir": "out",
    "bundledWebRuntime": false,
    "plugins": {
      "SplashScreen": {
        "launchShowDuration": 2000,
        "backgroundColor": "#2D1B4E"
      },
      "PushNotifications": {
        "presentationOptions": ["badge", "sound", "alert"]
      }
    }
  }
  ```

- [ ] **Native features**
  - [ ] Push notifications
  - [ ] Biometric auth (Face ID)
  - [ ] Camera access (for profile photos)
  - [ ] Local storage
  - [ ] Deep linking

- [ ] **Splash screen**
  ```bash
  # Generate splash screens
  npx @capacitor/assets generate --ios
  ```

- [ ] **Testing on iOS**
  ```bash
  # Open in Xcode
  npx cap open ios
  
  # Run on simulator
  # Run on physical device
  ```

### Submission (Week 9)
- [ ] **Build for App Store**
  ```bash
  # 1. Open Xcode
  npx cap open ios
  
  # 2. Select "Generic iOS Device"
  # 3. Product > Archive
  # 4. Wait for archive to complete
  ```

- [ ] **App Store Connect**
  - [ ] Create new app
  - [ ] Fill all metadata
  - [ ] Upload screenshots
  - [ ] Set pricing (Free)
  - [ ] Select countries (Saudi Arabia, UAE, etc.)

- [ ] **Upload build**
  - [ ] Xcode > Organizer
  - [ ] Select archive
  - [ ] Distribute App > App Store Connect
  - [ ] Upload
  - [ ] Wait for processing (1-2 hours)

- [ ] **Submit for review**
  - [ ] Select build
  - [ ] Add version notes
  - [ ] Contact information
  - [ ] Demo account (username: demo, password: demo123)
  - [ ] Submit!

### Review & Launch (Week 10)
- [ ] **Wait for review** (1-7 days)
  - [ ] Check status daily
  - [ ] Respond to any questions
  - [ ] Fix rejections if any

- [ ] **Common rejection reasons:**
  - Incomplete information
  - Broken features
  - Privacy policy missing
  - App crashes
  - Guideline violations

- [ ] **If rejected:**
  - Read feedback carefully
  - Fix issues
  - Resubmit
  - Be patient

- [ ] **If approved:**
  - 🎉 **CELEBRATE!**
  - Share on social media
  - Email all users
  - Press release
  - Monitor reviews

---

## 📊 Success Metrics

### Technical
- [ ] Uptime > 99.5%
- [ ] Response time < 2s
- [ ] Error rate < 0.1%
- [ ] Lighthouse score > 90
- [ ] Security score: A+

### Business
- [ ] 100+ active users (first month)
- [ ] NPS > 50
- [ ] App Store rating > 4.5
- [ ] 0 critical bugs
- [ ] < 5 support tickets/day

---

## 🚨 Emergency Contacts

### Technical Issues
- Developer: خالد
- Hosting: Hostinger Support
- Database: Supabase Support

### Business Issues
- Admin: محمد
- HR: user1

---

**آخر تحديث:** 23 فبراير 2026  
**الحالة:** ⏳ Pending - جاهز للبدء
