# Manual Testing Checklist - Albassam Schools App

**تاريخ:** 24 فبراير 2026  
**المختبر:** _______________  
**التاريخ:** _______________

---

## 📋 نظرة عامة

هذا الـ checklist يغطي جميع الميزات الرئيسية للتطبيق. اختبر كل نقطة وضع علامة ✅ عند النجاح أو ❌ عند الفشل.

---

## 🔐 Authentication & Authorization

### Login
- [ ] Login بـ username صحيح + password صحيح
- [ ] Login بـ username خاطئ
- [ ] Login بـ password خاطئ
- [ ] Login بدون username
- [ ] Login بدون password
- [ ] Remember me checkbox يعمل
- [ ] Forgot password link موجود
- [ ] Error messages واضحة
- [ ] Loading state أثناء Login
- [ ] Redirect للـ dashboard بعد login ناجح

### Logout
- [ ] Logout button موجود
- [ ] Logout يعمل بشكل صحيح
- [ ] Redirect للـ login page
- [ ] Session يتم مسحها
- [ ] لا يمكن الدخول للـ protected routes بعد logout

### Permissions
- [ ] Admin يرى جميع الميزات
- [ ] HR يرى ميزات HR فقط
- [ ] User عادي يرى الميزات المسموحة فقط
- [ ] Unauthorized access يعرض error message
- [ ] Forbidden pages تعيد توجيه أو تعرض 403

---

## 📊 Dashboard

### General
- [ ] Dashboard يحمّل بدون أخطاء
- [ ] Stats cards تعرض بيانات صحيحة
- [ ] Quick actions buttons تعمل
- [ ] Charts/graphs تعرض (إن وجدت)
- [ ] Loading state أثناء تحميل البيانات
- [ ] Responsive على mobile
- [ ] RTL (Arabic) يعمل بشكل صحيح

### User Dashboard
- [ ] User يرى tasks الخاصة به
- [ ] User يرى attendance status
- [ ] User يرى leave balance
- [ ] Links تعمل بشكل صحيح

### Admin Dashboard
- [ ] Admin يرى overview كامل
- [ ] Pending approvals list موجودة
- [ ] Statistics صحيحة
- [ ] Recent activity log موجود (إن وجد)

---

## 👥 HR Module - Employees

### Employee List
- [ ] List يحمّل جميع الموظفين
- [ ] Search يعمل
- [ ] Filter يعمل (department, status, etc.)
- [ ] Sorting يعمل (name, date, etc.)
- [ ] Pagination يعمل
- [ ] Empty state يعرض عند عدم وجود نتائج
- [ ] Loading state أثناء التحميل

### Create Employee
- [ ] Form يفتح بدون أخطاء
- [ ] Required fields validation
- [ ] Email format validation
- [ ] Phone format validation
- [ ] Date fields validation
- [ ] File upload يعمل (photo, documents)
- [ ] Save button يعمل
- [ ] Success message يعرض
- [ ] Redirect للـ list بعد save
- [ ] Error handling عند فشل save

### View Employee
- [ ] Employee details تعرض بشكل صحيح
- [ ] Photo تعرض (إن موجودة)
- [ ] Documents list موجودة
- [ ] Edit button موجود
- [ ] Delete button موجود (للـ admin)
- [ ] Attendance history موجودة
- [ ] Leave balance موجودة

### Edit Employee
- [ ] Form يملأ بالبيانات الحالية
- [ ] Update يعمل
- [ ] Validation تعمل
- [ ] Success message يعرض
- [ ] Changes تظهر فوراً

### Delete Employee
- [ ] Delete confirmation modal يعرض
- [ ] Delete يعمل
- [ ] Success message يعرض
- [ ] Employee يختفي من الـ list
- [ ] Cancel button يلغي العملية

---

## 📅 Attendance Module

### Check In/Out
- [ ] Check in button موجود
- [ ] Check in يسجل الوقت الصحيح
- [ ] Check out button يظهر بعد check in
- [ ] Check out يعمل
- [ ] Late arrival يتم تمييزه
- [ ] Early departure يتم تمييزه
- [ ] Cannot check in twice
- [ ] Cannot check out without check in

### Attendance List
- [ ] List يعرض سجلات الحضور
- [ ] Filter by date يعمل
- [ ] Filter by employee يعمل
- [ ] Export to Excel يعمل
- [ ] Statistics صحيحة (present, absent, late)
- [ ] Calendar view يعمل (إن موجد)

### Attendance Requests
- [ ] Request form يفتح
- [ ] Create request يعمل
- [ ] Request list تعرض
- [ ] Approve request يعمل (admin/HR)
- [ ] Reject request يعمل (admin/HR)
- [ ] Notifications ترسل

---

## 🏖️ Leave Management

### Request Leave
- [ ] Request form يفتح
- [ ] Leave type dropdown يعمل
- [ ] Date range picker يعمل
- [ ] Balance check يعمل
- [ ] Submit button يعمل
- [ ] Success message يعرض
- [ ] Notification ترسل للـ approver

### Leave List
- [ ] My leaves list تعرض
- [ ] Filter by status يعمل
- [ ] Filter by type يعمل
- [ ] View leave details يعمل
- [ ] Cancel leave يعمل (pending only)

### Leave Approval (Admin/HR)
- [ ] Pending leaves list تعرض
- [ ] View leave details
- [ ] Approve button يعمل
- [ ] Reject button يعمل
- [ ] Reject reason required
- [ ] Notification ترسل للـ employee
- [ ] Balance يتم تحديثه

### Leave Balance
- [ ] Balance يعرض لكل نوع إجازة
- [ ] Used/remaining accurate
- [ ] History موجودة

---

## ✅ Tasks Module

### Task List
- [ ] Tasks list تحمّل
- [ ] My tasks filter يعمل
- [ ] All tasks visible (admin)
- [ ] Status filter يعمل
- [ ] Priority filter يعمل
- [ ] Search يعمل

### Create Task
- [ ] Form يفتح
- [ ] Title required
- [ ] Description optional
- [ ] Assign to dropdown يعمل
- [ ] Priority dropdown يعمل
- [ ] Due date picker يعمل
- [ ] Attachments upload يعمل
- [ ] Create button يعمل
- [ ] Notification ترسل

### View Task
- [ ] Task details تعرض
- [ ] Comments section موجودة
- [ ] Add comment يعمل
- [ ] Status change يعمل
- [ ] Edit button موجود (owner/admin)
- [ ] Delete button موجود (owner/admin)

### Update Task
- [ ] Edit form يملأ بالبيانات
- [ ] Update يعمل
- [ ] Status change notifications

### Complete Task
- [ ] Mark as complete يعمل
- [ ] Completion date/time يسجل
- [ ] Notification ترسل

---

## 🛒 Procurement Module

### Purchase Requests
- [ ] Request list تحمّل
- [ ] Create request form يعمل
- [ ] Items list في الـ request
- [ ] Add item button يعمل
- [ ] Remove item يعمل
- [ ] Total calculation صحيح
- [ ] Submit request يعمل

### Approval Workflow
- [ ] Pending requests list (approver)
- [ ] View request details
- [ ] Approve button يعمل
- [ ] Reject button يعمل
- [ ] Workflow steps واضحة
- [ ] Notifications ترسل

### Purchase Orders
- [ ] Orders list تعرض
- [ ] Create from request يعمل
- [ ] Supplier selection يعمل
- [ ] Order status updates

---

## 📈 Reports Module

### Report Types
- [ ] Attendance report يعمل
- [ ] Leave report يعمل
- [ ] Employee report يعمل
- [ ] Financial report يعمل (إن موجد)
- [ ] Tasks report يعمل

### Report Features
- [ ] Date range filter يعمل
- [ ] Department filter يعمل
- [ ] Export to PDF يعمل
- [ ] Export to Excel يعمل
- [ ] Print يعمل
- [ ] Charts/graphs تعرض

---

## ⚙️ Settings Module

### General Settings
- [ ] Settings page تحمّل
- [ ] Update settings يعمل
- [ ] Save button يعمل
- [ ] Success message يعرض

### Branches
- [ ] Branches list تعرض
- [ ] Create branch يعمل
- [ ] Edit branch يعمل
- [ ] Delete branch يعمل

### Roles & Permissions
- [ ] Roles list تعرض
- [ ] Create role يعمل
- [ ] Edit permissions يعمل
- [ ] Assign role to user يعمل

### Attendance Settings
- [ ] Work hours settings
- [ ] Late threshold settings
- [ ] Save يعمل

---

## 🔔 Notifications

### Toast Notifications
- [ ] Success toast يعرض
- [ ] Error toast يعرض
- [ ] Warning toast يعرض
- [ ] Info toast يعرض
- [ ] Toast auto-dismisses
- [ ] Close button يعمل

### Notification Center
- [ ] Bell icon موجود
- [ ] Badge count صحيح
- [ ] Click يفتح panel
- [ ] Notifications list تعرض
- [ ] Mark as read يعمل
- [ ] Mark all as read يعمل
- [ ] Delete notification يعمل
- [ ] Click notification يفتح الـ link

---

## 📱 Responsive Design

### Desktop (1920x1080)
- [ ] Layout صحيح
- [ ] Navigation visible
- [ ] Tables readable
- [ ] Forms usable

### Laptop (1366x768)
- [ ] Layout يتكيف
- [ ] Sidebar responsive
- [ ] No horizontal scroll

### Tablet (768x1024)
- [ ] Mobile menu يظهر
- [ ] Tables scrollable
- [ ] Forms stackable

### Mobile (375x667)
- [ ] Navigation menu works
- [ ] Touch targets كافية
- [ ] Text readable
- [ ] Forms usable

---

## 🌐 Browser Compatibility

### Chrome (latest)
- [ ] All features working
- [ ] No console errors
- [ ] Performance good

### Firefox (latest)
- [ ] All features working
- [ ] No console errors
- [ ] Performance good

### Safari (latest)
- [ ] All features working
- [ ] No console errors
- [ ] Performance good

### Edge (latest)
- [ ] All features working
- [ ] No console errors
- [ ] Performance good

---

## 🌍 RTL & Arabic Support

### Text Direction
- [ ] Text right-to-left
- [ ] Numbers displayed correctly
- [ ] Icons positioned correctly
- [ ] Forms aligned correctly

### Navigation
- [ ] Sidebar on right side
- [ ] Dropdown menus align right
- [ ] Modals positioned correctly
- [ ] Tooltips positioned correctly

### Tables
- [ ] Columns align correctly
- [ ] Actions on left side
- [ ] Scrolling works correctly

---

## ⚡ Performance

### Page Load
- [ ] Home/login < 2 seconds
- [ ] Dashboard < 3 seconds
- [ ] Lists < 2 seconds
- [ ] Forms < 1 second

### API Response
- [ ] GET requests < 500ms
- [ ] POST requests < 1s
- [ ] File uploads reasonable time

### Interactions
- [ ] Clicks responsive
- [ ] Typing no lag
- [ ] Scrolling smooth
- [ ] Animations smooth

---

## 🔒 Security

### Authentication
- [ ] Passwords not visible in requests
- [ ] Session expires appropriately
- [ ] Logout clears session
- [ ] HTTPS enforced

### Authorization
- [ ] Users can't access unauthorized pages
- [ ] API returns 401/403 appropriately
- [ ] No sensitive data in URL
- [ ] No sensitive data in console

### Input Validation
- [ ] SQL injection protected
- [ ] XSS protected
- [ ] File upload restricted
- [ ] File size limited

---

## 🐛 Error Handling

### Network Errors
- [ ] Offline message shows
- [ ] Retry option available
- [ ] Timeout handled gracefully

### API Errors
- [ ] 404 page shows
- [ ] 500 error handled
- [ ] Error messages user-friendly
- [ ] Contact support option

### Form Errors
- [ ] Validation errors clear
- [ ] Error messages specific
- [ ] Focus on error field
- [ ] Multiple errors handled

---

## ✅ Summary

**Total Items:** _____ / _____  
**Pass Rate:** _____%

**Critical Issues:** ___  
**Major Issues:** ___  
**Minor Issues:** ___

**Overall Status:** ☐ Pass ☐ Fail ☐ Conditional Pass

**Notes:**
________________________________
________________________________
________________________________

**Tester Signature:** _______________
**Date:** _______________
