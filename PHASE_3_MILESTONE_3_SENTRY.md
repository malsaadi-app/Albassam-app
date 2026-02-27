# Phase 3 - Milestone 3: Error Tracking (Sentry) [OPTIONAL]

**الحالة:** 📝 Ready for Implementation (Optional)  
**المدة المقدرة:** 30-45 دقيقة  
**الأولوية:** Medium (موصى به للإنتاج)

---

## 🎯 الهدف

تفعيل نظام تتبع الأخطاء في الوقت الفعلي باستخدام Sentry:
- ✅ تتبع الأخطاء تلقائياً
- ✅ Stack traces مفصلة
- ✅ User context (من، متى، أين)
- ✅ Performance monitoring
- ✅ Release tracking
- ✅ Email alerts للأخطاء الجديدة

---

## 🤔 هل تحتاج Sentry؟

### ✅ Yes - إذا كنت تريد:
- **تتبع دقيق للأخطاء** - من المستخدم، المتصفح، الصفحة
- **Performance monitoring** - Slow API calls, database queries
- **Release tracking** - ربط الأخطاء بإصدارات معينة
- **Team collaboration** - مشاركة الأخطاء مع الفريق
- **Alert integration** - Slack, Discord, Email
- **User-impact analysis** - كم مستخدم تأثر

### ❌ No - إذا كان:
- **التطبيق صغير** - عدد قليل من المستخدمين
- **الميزانية محدودة** - بعد الـ free tier
- **لديك نظام حالي** - Winston logs + monitoring كافية
- **Privacy concerns** - لا تريد إرسال data خارجياً

---

## 📊 البدائل الحالية

### What We Already Have (Phase 3 - Milestone 1)
✅ **Winston Logger**
- Error logs → `logs/error-YYYY-MM-DD.log`
- 30-day retention
- Stack traces
- Performance counters

✅ **Error Handler** (`lib/error-handler.ts`)
- 7 error types classification
- Safe error messages
- Logging integration

✅ **Monitoring API** (`/api/monitoring`)
- Error counts
- Performance metrics
- System health

### What Sentry Adds
🆕 **Real-time Alerts**
- Email on new errors
- Slack/Discord integration
- Mobile app notifications

🆕 **Advanced Features**
- User session replay (optional)
- Breadcrumbs (user actions before error)
- Release comparison
- Issue assignment & tracking

🆕 **Better Debugging**
- Source maps for production code
- Local variables at crash point
- Environment & device info

---

## 🎛️ Setup Options

### Option 1: Sentry Cloud (Recommended)
**Free Tier:**
- 5,000 errors/month
- 10,000 performance events/month
- 30-day retention
- Email alerts
- 1 team member

**الخطوات:**
```bash
# 1. Install SDK
npm install --save @sentry/nextjs

# 2. Run wizard
npx @sentry/wizard@latest -i nextjs

# 3. Add DSN to .env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# 4. Deploy
pm2 restart albassam
```

**التكلفة:**
- Free: 5K errors/month
- Team ($26/mo): 50K errors/month
- Business ($80/mo): 100K errors/month

### Option 2: Self-Hosted Sentry
**Pros:**
- ✅ Free forever
- ✅ Full control
- ✅ No data limits

**Cons:**
- ❌ Complex setup (Docker, PostgreSQL, Redis)
- ❌ Maintenance overhead
- ❌ Requires 4GB+ RAM
- ❌ No built-in alerts

**Not recommended** for current setup.

### Option 3: Alternative Services

#### **1. GlitchTip** (Open-source Sentry alternative)
- Free self-hosted
- Simpler than Sentry
- Compatible with Sentry SDK
- https://glitchtip.com

#### **2. Rollbar**
- Similar to Sentry
- Free tier: 5K events/month
- https://rollbar.com

#### **3. Bugsnag**
- Error monitoring + stability score
- Free tier: 7,500 events/month
- https://bugsnag.com

#### **4. LogRocket** (Session replay focused)
- User session recording
- Free tier: 1K sessions/month
- https://logrocket.com

---

## 🚀 Implementation Plan (If You Choose Sentry)

### Step 1: Setup Sentry Account (5 min)
```
1. Go to https://sentry.io
2. Sign up (free)
3. Create new project: "Albassam Schools"
4. Platform: Next.js
5. Copy DSN
```

### Step 2: Install SDK (2 min)
```bash
cd /data/.openclaw/workspace/albassam-tasks
npm install --save @sentry/nextjs
```

### Step 3: Configure Sentry (10 min)
Create `sentry.client.config.ts`:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: 0.1, // 10% of requests
  
  // Error sampling
  beforeSend(event) {
    // Filter out known errors
    if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
      return null; // Don't send to Sentry
    }
    return event;
  },
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
});
```

Create `sentry.server.config.ts`:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Server-side sampling
  tracesSampleRate: 0.1,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
});
```

### Step 4: Add to Error Handler (5 min)
Update `lib/error-handler.ts`:
```typescript
import * as Sentry from '@sentry/nextjs';

export function handleError(error: unknown, context?: ErrorContext) {
  const appError = toAppError(error);
  
  // Log to Winston (existing)
  logger.error(appError.message, {
    type: appError.type,
    statusCode: appError.statusCode,
    stack: appError.stack,
    context,
  });
  
  // Send to Sentry (new)
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: {
        errorType: appError.type,
        statusCode: appError.statusCode.toString(),
      },
      contexts: {
        error_context: context,
      },
    });
  }
  
  return appError;
}
```

### Step 5: Test Integration (5 min)
Create test page `app/sentry-test/page.tsx`:
```typescript
'use client';

export default function SentryTest() {
  return (
    <div>
      <h1>Sentry Test</h1>
      <button onClick={() => {
        throw new Error('Test error for Sentry!');
      }}>
        Trigger Error
      </button>
    </div>
  );
}
```

Test:
```
1. Visit: https://app.albassam-app.com/sentry-test
2. Click "Trigger Error"
3. Check Sentry dashboard (should see error in 1-2 minutes)
```

### Step 6: Configure Alerts (5 min)
In Sentry dashboard:
```
1. Project Settings → Alerts
2. Create alert:
   - Name: "Critical Errors"
   - Condition: New issue is created
   - Action: Send email to (your email)
3. Save
```

---

## 📊 المقارنة: Winston Logs vs Sentry

| Feature | Winston Logs | Sentry | Winner |
|---------|--------------|--------|--------|
| **Error Logging** | ✅ | ✅ | Tie |
| **Stack Traces** | ✅ | ✅ Better | Sentry |
| **User Context** | ⚠️ Manual | ✅ Automatic | Sentry |
| **Real-time Alerts** | ❌ | ✅ | Sentry |
| **Performance Monitoring** | ⚠️ Basic | ✅ Advanced | Sentry |
| **Source Maps** | ❌ | ✅ | Sentry |
| **Cost** | ✅ Free | ⚠️ Free tier limited | Winston |
| **Privacy** | ✅ Self-hosted | ⚠️ Cloud-based | Winston |
| **Search & Filter** | ❌ Manual | ✅ Dashboard | Sentry |
| **Team Collaboration** | ❌ | ✅ | Sentry |

**الخلاصة:** Winston للـ basic logging كافي. Sentry للـ production-grade monitoring أفضل.

---

## 🎯 التوصية

### For Small Apps (<100 users)
**✅ Skip Sentry** - Winston + Monitoring API كافية:
- Error logs: `logs/error-YYYY-MM-DD.log`
- Monitoring: `/api/monitoring`
- Health checks: `/api/health` + UptimeRobot
- Cost: $0

### For Growing Apps (100-1000 users)
**⚠️ Consider Sentry Free Tier**:
- 5K errors/month usually enough
- Real-time alerts helpful
- Better debugging experience
- Cost: $0 (free tier)

### For Production Apps (1000+ users)
**🔥 Highly Recommended**:
- Critical for production monitoring
- User-impact tracking essential
- Performance insights valuable
- Cost: $0-26/month

---

## 💰 التكلفة المتوقعة

### Sentry Cloud Pricing
```
Free Tier:
- 5,000 errors/month
- 10,000 performance events/month
- 30-day retention
- 1 team member
Cost: $0/month

Team Plan:
- 50,000 errors/month
- 100,000 performance events/month
- 90-day retention
- Unlimited team members
Cost: $26/month

Business Plan:
- 100,000+ errors/month
- Custom retention
- Advanced features
Cost: $80+/month
```

### For Albassam App
**Expected usage:**
- ~30 schools × 50 users = 1,500 users
- Assuming 10 errors/user/month = 15,000 errors/month
- **Recommendation:** Team Plan ($26/month) بعد الـ pilot phase

---

## ✅ Decision Required

**يا محمد - قرار مطلوب:**

هل تبي تفعيل Sentry الحين؟

**Option A: Yes, activate Sentry now**
- ⏱️ 30 minutes setup
- 🆓 Free for 6-12 months (under 5K errors/month)
- ✅ Better error tracking
- ✅ Real-time alerts
- ⚠️ Data sent to Sentry servers

**Option B: Skip for now, use Winston**
- ⏱️ 0 minutes (already done)
- 🆓 Free forever
- ✅ Privacy (self-hosted)
- ✅ Good enough for pilot phase
- ⚠️ Manual log checking

**Option C: Decide later**
- Setup guide ready (this file)
- Can activate anytime in 30 min
- No rush - Winston works fine

---

## 📝 Files Ready (If You Choose Option A)

All implementation code is documented above. Just need:
1. محمد يسجل في Sentry
2. يعطيني الـ DSN
3. أنا أطبق الكود (~20 min)
4. نختبر ونخلص

---

**Milestone Status:** 📝 Documentation Complete, Implementation Pending  
**Recommendation:** **Option C** (Skip for now, decide after pilot phase)  
**Reason:** Winston + Monitoring + UptimeRobot كافية للشهر الأول. لو زاد عدد المستخدمين أو الأخطاء، نفعّل Sentry وقتها.

**Next Milestone:** Phase 3 - Milestone 4 (Analytics - Optional)
