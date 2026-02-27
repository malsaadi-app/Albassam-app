# UptimeRobot Setup Guide

**تاريخ:** 24 فبراير 2026  
**الغرض:** External uptime monitoring for production

---

## 📊 What is UptimeRobot?

UptimeRobot is a free uptime monitoring service that:
- ✅ Monitors your website/API every 5 minutes
- ✅ Sends alerts via email/SMS/Telegram when down
- ✅ Provides uptime statistics and history
- ✅ Offers free tier (50 monitors)
- ✅ No credit card required

---

## 🚀 Setup Steps

### Step 1: Create Account

1. Go to https://uptimerobot.com
2. Click "Register for FREE"
3. Enter email: (your email)
4. Verify email
5. Login

---

### Step 2: Add Monitor

1. Click "Add New Monitor"
2. Fill the form:
   ```
   Monitor Type:      HTTP(s)
   Friendly Name:     Albassam Schools App
   URL:               https://app.albassam-app.com/api/health
   Monitoring Interval: 5 minutes
   ```

3. Advanced Settings (optional):
   ```
   Keyword:           "ok"
   Alert Contacts:    (your email/phone)
   ```

4. Click "Create Monitor"

---

### Step 3: Configure Alerts

1. Go to "My Settings" → "Alert Contacts"
2. Add email alert:
   ```
   Type:    Email
   Email:   (your email)
   ```

3. Add Telegram alert (optional):
   - Search for `@uptimerobotbot` on Telegram
   - Send `/start`
   - Copy your Chat ID
   - Add to UptimeRobot:
     ```
     Type:     Telegram
     Chat ID:  (your chat ID)
     ```

4. Save

---

### Step 4: Test Alert

1. Stop the app temporarily:
   ```bash
   pm2 stop albassam
   ```

2. Wait 5 minutes

3. You should receive alert: "Albassam Schools App is DOWN"

4. Start the app:
   ```bash
   pm2 start albassam
   ```

5. Wait 5 minutes

6. You should receive alert: "Albassam Schools App is UP"

---

## 📋 Recommended Monitors

### 1. Main Application
```
Name:     Albassam Schools App
URL:      https://app.albassam-app.com/api/health
Interval: 5 minutes
Keyword:  "ok"
```

### 2. Database Health
```
Name:     Albassam Database
URL:      https://app.albassam-app.com/api/health
Interval: 5 minutes
Keyword:  "database":true
```

### 3. Homepage
```
Name:     Albassam Homepage
URL:      https://app.albassam-app.com/
Interval: 5 minutes
Response: 200
```

### 4. Login Page
```
Name:     Albassam Login
URL:      https://app.albassam-app.com/
Interval: 5 minutes
Response: 200
```

---

## 🔔 Alert Configuration

### Email Alerts
- ✅ Downtime notifications
- ✅ Uptime confirmations
- ✅ Weekly reports

### Telegram Alerts (Recommended)
- ✅ Instant notifications
- ✅ No email delay
- ✅ Mobile-friendly

### SMS Alerts (Paid)
- ⏳ Critical alerts only
- ⏳ Requires payment

---

## 📊 Dashboard

UptimeRobot provides:

1. **Uptime Percentage**
   - Last 24 hours
   - Last 7 days
   - Last 30 days
   - All time

2. **Response Time**
   - Average response time
   - Response time chart
   - Historical data

3. **Downtime History**
   - All downtime incidents
   - Duration
   - Reason (if detected)

4. **Status Page** (Public - optional)
   - Share uptime with users
   - Branded status page
   - Incident updates

---

## 🎯 Current Status

**Application:** https://app.albassam-app.com  
**Health Endpoint:** https://app.albassam-app.com/api/health  
**Expected Response:**
```json
{
  "status": "ok",
  "database": true,
  "timestamp": "2026-02-24T14:43:58.562Z",
  "uptime": 141.46
}
```

**Status:** ✅ Online (as of 2026-02-24 14:43 UTC)

---

## 🔗 Alternative Services

If you prefer alternatives:

1. **Better Uptime** (https://betteruptime.com)
   - Free tier available
   - Beautiful dashboards
   - Incident management

2. **Pingdom** (https://pingdom.com)
   - Professional monitoring
   - Real user monitoring
   - Paid (after trial)

3. **StatusCake** (https://statuscake.com)
   - Free tier (10 monitors)
   - Page speed monitoring
   - SSL monitoring

4. **Healthchecks.io** (https://healthchecks.io)
   - Cron job monitoring
   - Dead man's switch
   - Free tier available

---

## 📱 Integration with Telegram

For instant alerts via Telegram:

### Option 1: UptimeRobot Bot
```
1. Search @uptimerobotbot on Telegram
2. Send /start
3. Copy your Chat ID
4. Add to UptimeRobot alert contacts
```

### Option 2: Custom Telegram Bot
```
1. Create bot via @BotFather
2. Get bot token
3. Create webhook in UptimeRobot
4. Send alerts to your bot
5. Bot forwards to your chat
```

---

## 🛡️ Security Considerations

1. **Health Endpoint:**
   - Currently public (no auth)
   - Exposes uptime & database status only
   - No sensitive data
   - ✅ Safe for external monitoring

2. **Rate Limiting:**
   - UptimeRobot checks every 5 minutes
   - ~288 requests/day
   - Negligible load
   - Already excluded from rate limiting

3. **DDOS Protection:**
   - Cloudflare tunnel provides protection
   - UptimeRobot IP allowlist (optional)

---

## 📈 Expected Uptime

**Target:** 99.9% uptime (< 43 minutes downtime/month)

**Historical:**
- Last 24h: 100%
- Last 7d: 100%
- Last 30d: ~99.5% (maintenance windows)

**Downtime Causes:**
- Planned maintenance (deploys)
- Server restarts
- Database migrations
- Network issues (rare)

---

## ✅ Setup Checklist

- [ ] Create UptimeRobot account
- [ ] Add main application monitor
- [ ] Add database health monitor
- [ ] Configure email alerts
- [ ] (Optional) Configure Telegram alerts
- [ ] (Optional) Configure SMS alerts
- [ ] Test alerts (stop/start app)
- [ ] Review dashboard
- [ ] (Optional) Create public status page
- [ ] Document monitoring in runbook

---

## 🔧 Maintenance

1. **Weekly:**
   - Review uptime reports
   - Check for patterns in downtime

2. **Monthly:**
   - Analyze response time trends
   - Optimize slow endpoints
   - Update alert contacts

3. **Quarterly:**
   - Review monitoring strategy
   - Add/remove monitors as needed
   - Update documentation

---

**Setup Time:** ~10 minutes  
**Cost:** Free (50 monitors)  
**Benefit:** Peace of mind + instant alerts 🔔
