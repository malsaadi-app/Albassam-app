# Attendance & Check-in/out System - Documentation

## Overview
Complete attendance management system for Albassam Schools HR App with mandatory check-in via website, daily logs, comprehensive reports, and dashboard integration.

## ✅ Completed Features

### 1. Database Schema (Prisma)
✅ **AttendanceRecord Model**
- Fields: id, userId, checkIn, checkOut, workHours, location, date, status
- Status enum: PRESENT, LATE, ABSENT, HALF_DAY, EXCUSED
- Unique constraint on userId + date (prevents duplicate check-ins)
- GPS location support (optional)
- Automatic work hours calculation

✅ **AttendanceSettings Model**
- Configurable late threshold (default: 15 minutes)
- Work hours per day (default: 8 hours)
- Work start/end times (default: 08:00-16:00)
- Toggle for required check-out
- GPS tracking enable/disable

✅ **Database Migration**
- Migration applied successfully: `20260212235654_add_attendance_system`
- Seed data created with default settings

### 2. API Endpoints

#### Employee Attendance API (`/api/attendance`)
✅ **GET** - Fetch user's attendance records
- Query params: `date`, `startDate`, `endDate`, `userId`
- Returns attendance records with user info

✅ **POST** - Check in/out
- Actions: `check-in`, `check-out`
- Automatic status detection (PRESENT/LATE)
- GPS location capture (optional)
- Prevents duplicate check-in
- Auto-calculates work hours on check-out
- Validates check-out (must check-in first)

#### HR Attendance API (`/api/hr/attendance`)
✅ **GET** - View all employees' attendance (HR/Admin only)
- Filters: date, userId, department, status
- Returns present/absent employees
- Statistics: total, present, absent, late counts
- Attendance rate calculation

#### Attendance Reports API (`/api/hr/attendance/reports`)
✅ **GET** - Generate comprehensive reports
- Report types: daily, weekly, monthly, custom range
- Employee statistics (days present, late, work hours, attendance rate)
- Daily breakdown (day-by-day attendance)
- Department statistics
- Attendance rate calculations
- Total work hours tracking

#### Attendance Settings API (`/api/hr/attendance/settings`)
✅ **GET** - Fetch attendance settings (all roles)
✅ **PUT** - Update settings (Admin only)
- Validation with Zod schema
- Time format validation (HH:MM)

### 3. User Interface Pages

#### Employee Attendance Page (`/attendance`)
✅ **Features:**
- Big prominent check-in/check-out button
- Real-time clock display (updates every second)
- Current date in Arabic (Gregorian)
- Today's status display (حاضر/متأخر/غائب)
- Check-in/check-out time display
- Work hours counter (after check-out)
- GPS location capture (optional, browser-dependent)
- Duplicate check-in prevention
- Check-out validation (must check-in first)
- Glassmorphism design (purple & gold theme)
- Arabic RTL layout
- Success/error messages
- Completion confirmation after check-out

✅ **User Experience:**
- Clear visual feedback for each status
- Emoji indicators (🟢 check-in, 🔴 check-out)
- Work hours displayed after check-out
- Reminder to check-out if forgotten
- Status badges with color coding

#### HR Attendance Log (`/hr/attendance`)
✅ **Features:**
- Daily attendance overview for all employees
- Statistics cards:
  - Total employees
  - Present count (green)
  - Late count (yellow)
  - Absent count (red)
- Attendance rate percentage
- Filter by:
  - Date (calendar picker)
  - Department (dropdown)
  - Status (PRESENT/LATE/ABSENT)
- Two tables:
  1. Present/Late employees with full details
  2. Absent employees (highlighted in red)
- Employee details shown:
  - Employee number
  - Name
  - Department
  - Position
  - Check-in time
  - Check-out time
  - Work hours
  - Status badge
- Link to reports page
- Real-time filtering
- Glassmorphism design
- Arabic RTL layout

#### Attendance Reports Page (`/hr/attendance/reports`)
✅ **Features:**
- Report type selection (daily/weekly/monthly/custom)
- Date range picker for custom reports
- Summary statistics:
  - Total records
  - Present count
  - Late count
  - Attendance rate
  - Total work hours
  - Average work hours per day
- Visual charts (Canvas-based):
  - Daily breakdown bar chart (present/late/absent)
  - Department statistics horizontal bars
  - Color-coded (green/yellow/red)
  - Legend included
- Employee statistics table:
  - Days present vs late
  - Total work hours
  - Average work hours
  - Attendance rate (color-coded: green ≥90%, yellow ≥75%, red <75%)
- Export to Excel (CSV format) with UTF-8 BOM
- Department breakdown
- Filters preserved across navigation
- Glassmorphism design
- Arabic RTL layout

### 4. Dashboard Integration

✅ **Employee Dashboard Widget** (`/dashboard`)
- Attendance summary section added
- Today's status display:
  - Visual indicator (✅/⚠️/❌)
  - Status text (حاضر/متأخر/غائب)
  - Work hours for today (if checked out)
  - "لم تسجل الحضور" warning if not checked in
- Week statistics:
  - Days present this week
  - Total hours worked this week
- Month statistics:
  - Attendance rate percentage
  - Late days count (highlighted in yellow if > 0)
- Quick link to check-in page
- Stats cards with glassmorphism styling
- Integrated with existing dashboard layout

✅ **Dashboard API Enhancement** (`/api/dashboard/enhanced`)
- Added `attendanceStats` object to API response:
  - `today`: checkIn, checkOut, workHours, status
  - `week`: daysPresent, totalHours
  - `month`: workDays, presentDays, lateDays, attendanceRate
- Week calculation: Sunday to Saturday
- Month calculation: From start of current month
- Automatic week start detection (Sunday-based)

### 5. Navigation Integration

✅ **Main Sidebar** (`/app/components/Sidebar.tsx`)
- Added "⏰ الحضور والانصراف" menu item
- Accessible to all users
- Positioned after Tasks, before HR menu

✅ **HR Dashboard Quick Links** (`/hr/dashboard`)
- Added "⏰ الحضور" button
- Direct link to `/hr/attendance`
- Styled consistently with other quick links
- Visible to HR employees and admins

## Technical Implementation

### Design Patterns Used
- **Glassmorphism UI**: Consistent with app theme (purple #2D1B4E, gold #D4A574)
- **Arabic RTL**: All text and layouts properly right-to-left
- **Date Utilities**: Using `lib/dateUtils.ts` (Gregorian only)
- **Prisma ORM**: Type-safe database queries
- **Next.js App Router**: Server-side and client-side rendering
- **React Hooks**: useState, useEffect for state management

### Security & Authorization
- **Session-based auth**: Uses `getSession(await cookies())`
- **Role-based access**:
  - `/attendance`: All authenticated users
  - `/hr/attendance`: HR_EMPLOYEE and ADMIN only
  - `/hr/attendance/reports`: HR_EMPLOYEE and ADMIN only
  - Settings update: ADMIN only
- **User isolation**: Users can only see their own attendance (except HR/Admin)

### Data Validation
- **Zod schemas**: API request validation
- **Time format validation**: HH:MM format enforced
- **Business logic validation**:
  - No duplicate check-ins per day
  - Must check-in before check-out
  - Late detection based on configurable threshold

### Performance Optimizations
- **Database indexes**: On userId, date, status
- **Unique constraint**: Prevents duplicate check-ins at DB level
- **Efficient queries**: Using Prisma's include and where clauses
- **Date range queries**: Proper timezone handling

## File Structure

```
albassam-tasks/
├── prisma/
│   ├── schema.prisma (✅ Updated with AttendanceRecord, AttendanceSettings)
│   ├── seed.ts (✅ Added attendance settings seed)
│   └── migrations/20260212235654_add_attendance_system/ (✅ Applied)
├── app/
│   ├── attendance/
│   │   └── page.tsx (✅ Employee check-in/out page)
│   ├── hr/
│   │   ├── attendance/
│   │   │   ├── page.tsx (✅ HR daily log)
│   │   │   └── reports/
│   │   │       └── page.tsx (✅ Reports & charts)
│   │   └── dashboard/
│   │       └── page.tsx (✅ Updated with attendance link)
│   ├── dashboard/
│   │   └── page.tsx (✅ Updated with attendance widget)
│   ├── components/
│   │   └── Sidebar.tsx (✅ Updated with attendance menu)
│   └── api/
│       ├── attendance/
│       │   └── route.ts (✅ Check-in/out API)
│       ├── hr/
│       │   └── attendance/
│       │       ├── route.ts (✅ HR attendance log API)
│       │       ├── reports/
│       │       │   └── route.ts (✅ Reports API)
│       │       └── settings/
│       │           └── route.ts (✅ Settings API)
│       └── dashboard/
│           └── enhanced/
│               └── route.ts (✅ Updated with attendance stats)
└── ATTENDANCE_SYSTEM.md (✅ This file)
```

## Build Status
✅ **Build successful with ZERO errors**
- Compiled successfully
- All type checks passed
- All 47 pages generated
- No linting errors
- Production-ready

```
Route (app)                                        Size  First Load JS
├ ○ /attendance                                  2.7 kB         105 kB
├ ○ /hr/attendance                              2.37 kB         108 kB
├ ○ /hr/attendance/reports                      2.93 kB         108 kB
├ ƒ /api/attendance                               236 B         102 kB
├ ƒ /api/hr/attendance                            236 B         102 kB
├ ƒ /api/hr/attendance/reports                    236 B         102 kB
├ ƒ /api/hr/attendance/settings                   236 B         102 kB
```

## Usage Instructions

### For Employees
1. Navigate to **⏰ الحضور والانصراف** from sidebar
2. Click **🟢 تسجيل الحضور** when arriving at work
3. System records check-in time and status (حاضر/متأخر)
4. Click **🔴 تسجيل الانصراف** when leaving work
5. View today's status on dashboard

### For HR/Admin
1. Navigate to **HR Dashboard** → **⏰ الحضور**
2. View daily attendance log with all employees
3. Filter by date, department, or status
4. Click **📊 التقارير** for detailed reports
5. Select report type (daily/weekly/monthly/custom)
6. Export data to Excel for further analysis
7. Update settings via `/api/hr/attendance/settings` (Admin only)

## Configuration

### Attendance Settings (Admin)
Update via PUT `/api/hr/attendance/settings`:
```json
{
  "lateThresholdMinutes": 15,
  "workHoursPerDay": 8,
  "workStartTime": "08:00",
  "workEndTime": "16:00",
  "requireCheckOut": true,
  "enableGpsTracking": false
}
```

## Testing Checklist

### Employee Flow
- [x] Check-in button visible on `/attendance`
- [x] Check-in records timestamp correctly
- [x] Duplicate check-in prevented
- [x] Late status detected correctly
- [x] Check-out button appears after check-in
- [x] Check-out calculates work hours
- [x] GPS location captured (if available)
- [x] Dashboard shows today's attendance status

### HR Flow
- [x] HR can view all employees' attendance
- [x] Absent employees list displayed
- [x] Filters work correctly (date, department, status)
- [x] Statistics calculated accurately
- [x] Reports page accessible
- [x] Charts render correctly
- [x] Excel export works with Arabic text (UTF-8 BOM)
- [x] Date range filters work

### Admin Flow
- [x] Settings API protected (Admin only)
- [x] Settings update successfully
- [x] Updated settings affect late detection

## Future Enhancements (Optional)
- [ ] QR code check-in (office location verification)
- [ ] Geofencing (validate check-in location)
- [ ] Mobile app integration
- [ ] Biometric authentication integration
- [ ] Email notifications for missing check-in/out
- [ ] Shift management (multiple work schedules)
- [ ] Overtime tracking
- [ ] Break time tracking
- [ ] Integration with payroll system
- [ ] Advanced analytics (trends, patterns)

## Deployment Notes

### Production Server
- Server runs on port 3000
- SQLite database: `prisma/prod.db`
- Build command: `npm run build`
- Start command: `npm start`
- Live URL: https://app.albassam-app.com

### Environment Variables Required
```env
DATABASE_URL="file:./prod.db"
JWT_SECRET="your-secret-key"
```

### Post-Deployment Steps
1. Run database migration: `npx prisma migrate deploy`
2. Run seed (if fresh install): `npx tsx prisma/seed.ts`
3. Verify attendance settings created
4. Test check-in/out flow
5. Test HR attendance log
6. Test reports generation
7. Test Excel export

## Troubleshooting

### Issue: Can't check-in
- **Solution**: Verify no existing check-in for today exists
- **Check**: Query `AttendanceRecord` table for userId + today's date

### Issue: Work hours not calculating
- **Solution**: Ensure both checkIn and checkOut are recorded
- **Check**: Database record has both timestamps

### Issue: Late status not working
- **Solution**: Verify `AttendanceSettings.lateThresholdMinutes` and `workStartTime`
- **Check**: Settings API returns correct values

### Issue: Absent employees not showing
- **Solution**: Verify employees have `status: 'ACTIVE'` in Employee table
- **Check**: Only active employees are included in absent list

### Issue: Charts not rendering
- **Solution**: Ensure Canvas element is present and data exists
- **Check**: Browser console for errors, verify data in API response

## Credits
- **Developer**: OpenClaw Subagent
- **Framework**: Next.js 15.5.12
- **Database**: SQLite with Prisma ORM
- **Design**: Glassmorphism (Purple & Gold theme)
- **Language**: Arabic RTL
- **Date Format**: Gregorian calendar

## Support
For issues or questions, contact the development team or refer to:
- Prisma docs: https://www.prisma.io/docs
- Next.js docs: https://nextjs.org/docs

---

**Status**: ✅ Completed & Production Ready
**Build**: ✅ Zero Errors
**Timeline**: Completed within 3-4 hours as requested
**Last Updated**: February 13, 2026
