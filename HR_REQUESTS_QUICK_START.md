# HR Requests System - Quick Start Guide

## ✅ Build Status: SUCCESS

The build completed successfully with zero TypeScript errors!

## 🚀 Quick Start

### 1. Start the Application

```bash
npm start
```

The app will be available at: http://localhost:3000

### 2. Login with Test Accounts

All passwords: `abcde12345`

**Admin Account:**
- Username: `mohammed`
- Role: ADMIN
- Can: Approve/reject final requests

**HR Employee Account:**
- Username: `user1`
- Role: HR_EMPLOYEE
- Can: Review and approve/return requests

**Regular Employee Accounts:**
- Usernames: `user2`, `user3`, `user4`, `user5`, `user6`
- Role: USER
- Can: Submit requests and edit returned requests

### 3. Test the Workflow

#### As an Employee (user2):

1. Login at `/auth/login`
2. Click "طلبات الموارد البشرية" in sidebar
3. Click "+ إضافة طلب جديد"
4. Select "طلب إجازة" (Leave Request)
5. Fill in:
   - Leave type: "إجازة سنوية"
   - Start date: Tomorrow
   - End date: 3 days later
   - Reason: "إجازة عائلية"
6. Click "إرسال الطلب"
7. Notice notification sent to user1

#### As HR Employee (user1):

1. Logout and login as `user1`
2. Notice badge on "طلبات الموارد البشرية" (shows pending count)
3. Click to see requests
4. Click on the pending request
5. Review details
6. Try "إرجاع للموظف" (Return):
   - Add comment: "يرجى إضافة مستند إثبات"
   - Submit
   - user2 will receive notification

#### As Employee (user2) - Resubmit:

1. Login back as `user2`
2. See returned request with orange badge
3. Click "تعديل الطلب"
4. See HR comment at top
5. Update reason: "إجازة عائلية - تم إرفاق المستند"
6. Submit
7. user1 receives notification

#### As HR Employee (user1) - Approve:

1. Login as `user1`
2. See resubmitted request
3. Click "توجيه للمدير"
4. Add comment: "الطلب مكتمل"
5. Submit
6. Mohammed receives notification

#### As Admin (mohammed) - Final Decision:

1. Login as `mohammed`
2. See badge on sidebar
3. Click pending approval request
4. Click "الموافقة"
5. Add comment: "تمت الموافقة"
6. Submit
7. Leave balance is auto-deducted
8. user2 receives approval notification

## 📋 Available Request Types

1. **طلب إجازة** (Leave Request)
   - Annual, sick, or emergency leave
   - Auto-deducts from balance on approval

2. **طلب بدل تذاكر** (Ticket Allowance)
   - Destination, travel date, amount

3. **طلب حجز طيران** (Flight Booking)
   - Destination, departure/return dates

4. **طلب تعريف بالراتب** (Salary Certificate)
   - Purpose, recipient organization

5. **طلب بدل سكن** (Housing Allowance)
   - Amount, period, reason

## 🔔 Notifications

Access notifications by clicking "الإشعارات" in sidebar:
- Bell icon shows unread count
- Click notification to view related request
- Mark as read individually or all at once

## 🎨 UI Features

- **RTL Arabic layout**
- **Glassmorphism design**
- **Mobile responsive**
- **Color-coded status badges:**
  - 🟠 Orange: Pending Review
  - 🟠 Orange-Red: Returned
  - 🟡 Yellow: Pending Approval
  - 🟢 Green: Approved
  - 🔴 Red: Rejected

## 📊 Workflow States

```
Employee Submits
    ↓
[PENDING_REVIEW] → HR Reviews
    ↓                    ↓
    ↓              [RETURNED] → Employee Edits
    ↓                    ↓
    ↓←───────────────────┘
    ↓
HR Approves → [PENDING_APPROVAL]
    ↓
Manager Reviews
    ↓            ↓
[APPROVED]  [REJECTED]
```

## 🗂️ Navigation

- `/hr/requests` - All requests (filtered by role)
- `/hr/requests/new` - Submit new request
- `/hr/requests/[id]` - View request details
- `/hr/requests/[id]/edit` - Edit returned request
- `/notifications` - View all notifications
- `/hr/dashboard` - HR dashboard with stats

## 🔍 Filtering

On the requests list page:
- Filter by **Status**: All, Pending Review, Returned, Pending Approval, Approved, Rejected
- Filter by **Type**: All, Leave, Ticket Allowance, Flight Booking, Salary Certificate, Housing Allowance

## 💡 Tips

1. **Badge Updates**: Sidebar badges refresh every 30 seconds automatically
2. **Real-time**: Notifications appear instantly after actions
3. **Comments Required**: Review and approval actions require a comment
4. **Edit Restrictions**: Only RETURNED requests can be edited
5. **Leave Balance**: Check `/hr/dashboard` for employee leave balances

## ⚠️ Important Notes

- **Leave requests** automatically deduct from balance ONLY on final approval
- **Comments** are required when reviewing or approving/rejecting
- **Status changes** trigger notifications to relevant parties
- **Timeline** shows complete workflow history on request details page

## 🐛 Troubleshooting

### If sidebar doesn't show badges:
1. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. Check browser console for errors
3. Ensure logged in with correct role

### If requests don't appear:
1. Check filters (reset to "All")
2. Ensure you're logged in
3. Check database: `npx prisma studio`

### If notifications don't work:
1. Check `/api/notifications` endpoint
2. Verify database has Notification table
3. Check browser console for errors

## 📞 API Endpoints

Test with curl or Postman:

```bash
# Get all requests (filtered by role)
GET /api/hr/requests

# Get specific request
GET /api/hr/requests/[id]

# Submit new request
POST /api/hr/requests
Content-Type: application/json
{
  "type": "LEAVE",
  "startDate": "2026-02-15",
  "endDate": "2026-02-18",
  "leaveType": "annual",
  "reason": "Family vacation"
}

# Review request (HR only)
POST /api/hr/requests/[id]/review
Content-Type: application/json
{
  "action": "approve",
  "comment": "Approved"
}

# Approve/reject request (Admin only)
POST /api/hr/requests/[id]/approve
Content-Type: application/json
{
  "action": "approve",
  "comment": "Final approval"
}

# Get notifications
GET /api/notifications?unreadOnly=true

# Mark as read
POST /api/notifications
Content-Type: application/json
{
  "notificationId": "cm5abc123"
}
```

## 🎯 Success Criteria Checklist

✅ Mohammed can log in and see all requests  
✅ user1 can review and approve/return requests  
✅ user2-6 can submit and edit returned requests  
✅ Notifications work for all parties  
✅ Leave requests auto-deduct from balance  
✅ All 5 request types work properly  
✅ Mobile-friendly, Arabic RTL, glassmorphism UI  
✅ **Build successful** (Zero TypeScript errors)

## 🎉 Congratulations!

The HR Requests Workflow System is fully implemented and ready for production use!

For detailed technical documentation, see `HR_REQUESTS_IMPLEMENTATION.md`.
