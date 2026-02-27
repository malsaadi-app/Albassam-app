# HR Requests Workflow System - Implementation Documentation

## 🎯 Overview

This document describes the complete implementation of the HR Requests Management System with multi-stage approval workflow for the Albassam Schools App.

## ✅ Implemented Features

### 1. Database Schema

#### New Models Added

**HRRequest Model**
- 5 request types: LEAVE, TICKET_ALLOWANCE, FLIGHT_BOOKING, SALARY_CERTIFICATE, HOUSING_ALLOWANCE
- 5 workflow states: PENDING_REVIEW, RETURNED, PENDING_APPROVAL, APPROVED, REJECTED
- Support for all required fields (dates, amounts, destinations, purposes, etc.)
- Multi-stage workflow with review and approval tracking

**Notification Model**
- User notifications for all workflow stages
- Read/unread status tracking
- Related entity linking

**User Role Enhancement**
- Added HR_EMPLOYEE role to the Role enum
- Updated seed to assign user1 as HR_EMPLOYEE
- Mohammed remains ADMIN, user2-6 remain USER

#### Migration
- File: `prisma/migrations/20260212203550_init/migration.sql`
- Successfully applied and tested

### 2. API Endpoints

All endpoints use iron-session authentication and role-based access control.

#### `/api/hr/requests` (GET, POST)
- **GET**: List requests filtered by user role
  - Regular users see their own requests
  - HR employees see pending reviews
  - Admins see all requests
- **POST**: Submit new request
  - Validates request type and required fields
  - Creates notification for HR employees

#### `/api/hr/requests/[id]` (GET, PUT)
- **GET**: Get request details with full workflow history
- **PUT**: Edit request (only if status is RETURNED)
  - Resets status to PENDING_REVIEW
  - Notifies HR employee of resubmission

#### `/api/hr/requests/[id]/review` (POST)
- HR Employee review action
- Actions: approve (forward to admin) or return (back to employee)
- Comment required
- Creates appropriate notifications

#### `/api/hr/requests/[id]/approve` (POST)
- Admin final approval/rejection
- Auto-deducts leave balance for approved leave requests
- Creates notification for employee

#### `/api/notifications` (GET, POST)
- **GET**: Fetch user notifications with unread count
- **POST**: Mark notifications as read (individual or all)

#### `/api/auth/me` (GET)
- Returns current user session info
- Used by UI components to determine role and permissions

### 3. UI Pages

All pages feature:
- RTL Arabic layout
- Glassmorphism design (purple #2D1B4E, gold #D4A574)
- Mobile-responsive design
- Smooth animations and transitions

#### `/hr/requests` - List View
- Filters by status and type
- Color-coded status badges
- Click to view details

#### `/hr/requests/new` - Submit New Request
- Dynamic form based on request type
- Field validation
- Type-specific fields display

#### `/hr/requests/[id]` - Request Details
- Full request information display
- Timeline showing workflow progress
- Action buttons based on role and status:
  - HR Employee: Approve/Return buttons (PENDING_REVIEW)
  - Admin: Approve/Reject buttons (PENDING_APPROVAL)
  - Employee: Edit button (RETURNED)
- Review and approval comments display

#### `/hr/requests/[id]/edit` - Edit Request
- Only accessible for RETURNED requests
- Pre-populated with existing data
- Shows HR employee's comment at top
- Resubmits as PENDING_REVIEW

#### `/notifications` - Notifications Page
- List all notifications with unread indicator
- Click to navigate to related request
- Mark individual or all as read
- Real-time relative timestamps

### 4. Sidebar Integration

Updated `app/components/Sidebar.tsx`:
- Added "طلبات الموارد البشرية" menu item
- Badge showing pending requests count (for HR_EMPLOYEE and ADMIN)
- Added "الإشعارات" menu item with unread count badge
- Polls for updates every 30 seconds
- Smooth badge animations

### 5. Workflow Logic

#### Stage 1: Employee Submits Request
1. Employee fills form and submits
2. Status: PENDING_REVIEW
3. Notification sent to all HR employees (user1)

#### Stage 2: HR Employee Reviews
**Option A: Forward to Manager**
1. HR employee adds comment and approves
2. Status changes to PENDING_APPROVAL
3. Notification sent to admin (Mohammed)

**Option B: Return to Employee**
1. HR employee adds comment explaining what's missing
2. Status changes to RETURNED
3. Notification sent to employee

#### Stage 3: Employee Resubmits (if returned)
1. Employee edits request based on feedback
2. Status resets to PENDING_REVIEW
3. Notification sent to HR employee

#### Stage 4: Manager Final Decision
**Option A: Approve**
1. Admin approves with optional comment
2. Status: APPROVED
3. For leave requests: auto-deduct from balance
4. Notification sent to employee

**Option B: Reject**
1. Admin rejects with comment
2. Status: REJECTED
3. Notification sent to employee

### 6. Leave Balance Auto-Deduction

When a leave request is approved:
1. Calculate days between start and end date
2. Find employee's current year leave balance
3. Deduct from appropriate balance:
   - Annual leave → annualUsed/annualRemaining
   - Sick/Emergency → casualUsed/casualRemaining
4. Update balance record

## 🗂️ File Structure

```
app/
├── api/
│   ├── auth/
│   │   └── me/
│   │       └── route.ts
│   ├── hr/
│   │   └── requests/
│   │       ├── route.ts (GET, POST)
│   │       └── [id]/
│   │           ├── route.ts (GET, PUT)
│   │           ├── review/
│   │           │   └── route.ts (POST)
│   │           └── approve/
│   │               └── route.ts (POST)
│   └── notifications/
│       └── route.ts (GET, POST)
├── hr/
│   └── requests/
│       ├── page.tsx (list view)
│       ├── new/
│       │   └── page.tsx (submit form)
│       └── [id]/
│           ├── page.tsx (details)
│           └── edit/
│               └── page.tsx (edit form)
├── notifications/
│   └── page.tsx
└── components/
    └── Sidebar.tsx (updated)

prisma/
├── schema.prisma (updated)
├── seed.ts (updated)
└── migrations/
    └── 20260212203550_init/
        └── migration.sql
```

## 🔐 Security

- All API routes protected with iron-session authentication
- Role-based access control enforced
- Users can only edit their own returned requests
- HR employees can only review PENDING_REVIEW requests
- Admins can only approve PENDING_APPROVAL requests

## 📊 Testing Checklist

### User Accounts (All with password: `abcde12345`)
- **mohammed**: ADMIN - Can approve/reject final stage
- **user1**: HR_EMPLOYEE - Can review and approve/return
- **user2-6**: USER - Can submit and edit returned requests

### Test Scenarios

1. **Submit Leave Request** (as user2)
   - Login as user2
   - Go to /hr/requests/new
   - Select "طلب إجازة"
   - Fill dates and submit
   - Should see notification sent to user1

2. **Review and Return** (as user1)
   - Login as user1
   - See badge in sidebar
   - Click request
   - Add comment and return
   - user2 should receive notification

3. **Edit and Resubmit** (as user2)
   - Login as user2
   - See returned request
   - Click edit button
   - Update fields and resubmit
   - user1 should receive notification

4. **Forward to Admin** (as user1)
   - Login as user1
   - Review request
   - Add comment and approve
   - Should forward to Mohammed

5. **Final Approval** (as Mohammed)
   - Login as mohammed
   - See badge in sidebar
   - Review request
   - Approve or reject
   - For leave: check balance deduction
   - Employee should receive notification

## 🎨 Design System

### Colors
- Primary Purple: `#2D1B4E`
- Gold Accent: `#D4A574`
- Success: `#4CAF50`
- Warning: `#FFA500`
- Error: `#F44336`

### Status Colors
- PENDING_REVIEW: Orange `#FFA500`
- RETURNED: Orange-Red `#FF6B35`
- PENDING_APPROVAL: Gold `#FFD700`
- APPROVED: Green `#4CAF50`
- REJECTED: Red `#F44336`

### Typography
- Headings: Bold, White or Gold
- Body: Regular, White or rgba(255,255,255,0.8)
- Labels: Gold `#D4A574`

## 🚀 Deployment

### Build Command
```bash
npm run build
```

### Database Migrations
```bash
npx prisma migrate deploy
npx prisma generate
npm run seed
```

### Environment Variables
Ensure `.env` contains:
```
DATABASE_URL="file:./prod.db"
SESSION_SECRET="your-secret-here"
```

## 📝 Usage Guide

### For Employees (USER role)
1. Click "طلبات الموارد البشرية" in sidebar
2. Click "+ إضافة طلب جديد"
3. Select request type
4. Fill required fields
5. Submit
6. Track status in requests list
7. Edit if returned by HR

### For HR Employees
1. See badge count in sidebar
2. Click "طلبات الموارد البشرية"
3. Review pending requests
4. Click request to see details
5. Either forward to manager or return to employee
6. Add comment (required)

### For Administrators
1. See badge count for pending approvals
2. Review forwarded requests
3. Make final decision (approve/reject)
4. Add comment explaining decision

## 🔔 Notifications

Users receive notifications for:
- Request submitted (HR employees)
- Request returned (employee)
- Request forwarded (admin)
- Request approved (employee)
- Request rejected (employee)
- Request resubmitted (HR employee)

Access notifications:
- Bell icon badge in sidebar
- Click "الإشعارات" menu item
- Click notification to view related request

## ⚡ Performance

- API responses cached for 30 seconds in sidebar
- Optimistic UI updates for notifications
- Lazy loading of request details
- Efficient database queries with Prisma

## 🐛 Known Limitations

1. File attachments not yet implemented (prepared in schema)
2. Leave balance check before submission not enforced
3. No email notifications (only in-app)
4. No request history log (shows current state only)

## 🔮 Future Enhancements

1. File upload support for attachments
2. Email notifications via SMTP
3. Request cancellation by employee
4. Detailed audit log
5. Advanced filtering and search
6. Export to PDF/Excel
7. Calendar integration for leave requests
8. Mobile app with push notifications

## 📞 Support

For issues or questions:
- Check console logs in browser DevTools
- Check server logs: `app.log`
- Review Prisma logs for database issues

## ✨ Credits

Developed for Albassam Schools App
Implementation Date: February 12, 2026
