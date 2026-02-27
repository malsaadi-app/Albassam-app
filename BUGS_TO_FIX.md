# 🐛 BUGS TO FIX - Attendance System

**Priority Order for Fixing**

---

## 🔴 CRITICAL (Fix Immediately)

### 1. Dashboard Attendance Widget Shows Incorrect Data
- **File:** `/app/dashboard/page.tsx` or attendance widget component
- **Issue:** Widget shows "لم تسجل الحضور اليوم" even after user checked in/out
- **Impact:** Users cannot trust dashboard data
- **Fix:** Widget needs to fetch real-time attendance data from API endpoint
- **Test:** After fix, check in as user2, then verify dashboard shows correct status

### 2. Late Arrival Detection Not Working
- **File:** `/app/api/attendance/route.ts` or backend attendance service
- **Issue:** Check-in at 01:09 AM shows "حاضر" instead of "متأخر" (late)
- **Impact:** Cannot track late arrivals
- **Fix:** Review logic comparing check-in time vs (work start time + 15 min threshold)
- **Test:** Check in after 08:15 AM, verify status shows "متأخر" with yellow badge

### 3. Charts Not Displaying (Only Green Placeholders)
- **File:** `/app/hr/attendance/reports/page.tsx`
- **Issue:** Chart.js components render as solid green boxes, no actual graphs
- **Impact:** Cannot visualize attendance trends
- **Fix:** Debug Chart.js integration, verify data format and chart configuration
- **Test:** Generate daily report, verify charts show actual bar/line graphs with data

---

## ⚠️ HIGH PRIORITY (Fix Before Release)

### 4. Authorization Not Tested
- **Files:** Middleware or HR route guards
- **Issue:** Need to verify user2 (USER role) cannot access `/hr/attendance` pages
- **Impact:** Potential unauthorized access to HR data
- **Test:** Login as user2, try accessing `/hr/attendance` and `/hr/attendance/reports`, should redirect or show error

---

## 📋 MEDIUM PRIORITY (Fix Soon)

### 5. Sidebar Menu Inconsistent Visibility
- **File:** Sidebar component
- **Issue:** "⏰ الحضور والانصراف" shows on some pages but not others for same user
- **Fix:** Make menu item visibility consistent based on user role, not page
- **Test:** Check sidebar on dashboard, tasks, HR pages - menu should always show

### 6. Work Hours Display Inconsistent
- **File:** `/app/hr/attendance/page.tsx`
- **Issue:** Shows "-" instead of "0.00 ساعة" for work hours
- **Fix:** Display "0.00" for zero hours instead of dash
- **Test:** Check HR attendance log after check-in/out, verify format

---

## ❓ NEEDS VERIFICATION (Test These)

### 7. GPS Location Capture
- **Status:** Unknown if working
- **Test:** Check database attendance records for GPS coordinates
- **Action:** If not capturing, verify geolocation API call in check-in flow

### 8. Duplicate Check-in Prevention
- **Status:** Not tested
- **Test:** After checking in, try to check in again same day
- **Expected:** Error message "لقد سجلت الحضور بالفعل اليوم"
- **Action:** If allows duplicate, add database unique constraint (userId, date)

### 9. Excel Export
- **Status:** Button exists but not tested
- **Test:** Click "📥 تصدير Excel" button
- **Expected:** CSV file downloads with Arabic text (UTF-8 BOM encoding)
- **Action:** Verify Arabic characters display correctly in Excel

### 10. Real-time Updates
- **Status:** Not tested
- **Test:** Open HR log in two browsers, check in with one user, verify other browser shows update
- **Expected:** Attendance log refreshes or shows new check-in without manual refresh
- **Action:** If not updating, add polling or WebSocket for real-time updates

---

## 🔧 Quick Fix Checklist

**Before Mohammed's approval:**

- [ ] Fix dashboard widget data (fetch from `/api/attendance`)
- [ ] Fix late arrival detection (backend logic)
- [ ] Fix chart visualization (Chart.js integration)
- [ ] Test authorization (user2 blocked from HR pages)
- [ ] Test Excel export (download + Arabic text)
- [ ] Test duplicate check-in (error handling)
- [ ] Fix sidebar menu consistency
- [ ] Verify GPS location capture
- [ ] Test real-time updates

**Estimated Time:** 3-4 hours development + 1 hour testing

---

## 🎯 Success Criteria

System is ready for 100% approval when:

1. ✅ Zero console errors
2. ✅ Zero build errors
3. ✅ All features work as specified
4. ✅ Dashboard widget shows real data
5. ✅ Late arrivals detected correctly
6. ✅ Charts display actual graphs
7. ✅ Authorization blocks USER role from HR pages
8. ✅ Excel export downloads with correct Arabic encoding
9. ✅ Duplicate check-ins prevented
10. ✅ All UI/UX matches design standards

---

**Last Updated:** February 13, 2026, 01:15 AM
