# ⚡ Quick Start Guide - Phase 3 Features

## 🚀 Access the New Dashboard

**URL:** https://app.albassam-app.com/dashboard

The dashboard shows:
- 📊 Your task statistics
- 📜 Recent activity across all tasks
- ⚠️ Overdue tasks (if any)
- 📁 Recently uploaded files
- 👥 Team stats (admin only)

---

## 💬 Using Comments & Mentions

### Add a Comment:
1. Open any task
2. Scroll to the **"التعليقات"** section
3. Type your comment
4. Use `@username` to mention someone
5. Click **"@ ذكر شخص"** to see available users
6. Click **"💬 إرسال التعليق"**

### What Happens:
- The mentioned user gets a **Telegram notification**
- The task owner is notified about new comments
- Comments appear in timeline with timestamps

---

## 📜 Viewing Task History

### See Timeline:
1. Open any task
2. Scroll to **"📜 سجل النشاطات"**
3. Click **"عرض الكل"** to expand

### What You See:
- ✨ Task created
- ✏️ Updates made
- 📊 Status changes
- 👤 Owner changes
- ✅ Checklist updates
- Who made each change
- When it happened (relative time)

---

## ✅ Using Templates & Checklists

### Create Task from Template:
1. Go to **Tasks** page
2. Click **"+ مهمة جديدة"**
3. Look for **"من قالب"** button (if implemented)
4. Or use API: `GET /api/templates`

### Manage Checklist:
1. Open a task
2. Find **"✅ المهام الفرعية"** section
3. Check/uncheck items as you complete them
4. Add new items using the input box
5. Delete items with the **"حذف"** button

### Progress Tracking:
- Visual progress bar shows completion %
- Counts displayed: "3/7" completed
- Changes save automatically

---

## 🔔 Smart Notifications (Telegram)

### Currently Active:
- ✅ Task assigned to you
- ✅ Someone mentions you in a comment
- ✅ New comment on your task
- ✅ Status changes

### Coming Soon:
- ⏰ Overdue task reminders
- 📅 Due soon notifications (24h before)
- 📊 Daily summary at 8 AM

### Manage Preferences:
- Database fields are ready
- UI can be added in Profile page

---

## 🎯 Using Priority Levels

### API Support Ready:
```bash
# Set task priority
PATCH /api/tasks
{
  "taskId": "xxx",
  "priority": "HIGH"  // LOW, MEDIUM, or HIGH
}
```

### Visual Indicators:
- 🔴 High priority
- 🟡 Medium priority
- ⚪ Low priority

*Note: UI integration in Tasks page is pending*

---

## ⏰ Setting Due Dates

### API Support Ready:
```bash
# Set due date
PATCH /api/tasks
{
  "taskId": "xxx",
  "dueDate": "2026-02-20T12:00:00Z"
}
```

### Features:
- Countdown display
- Color coding (red=overdue, yellow=soon, green=plenty of time)
- Overdue filter in search

*Note: Date picker UI is pending*

---

## 🔄 Bulk Actions (API Only)

### Update Multiple Tasks:
```bash
# Bulk status update
POST /api/tasks/bulk
{
  "taskIds": ["id1", "id2", "id3"],
  "action": "updateStatus",
  "value": "IN_PROGRESS"
}

# Bulk priority update
POST /api/tasks/bulk
{
  "taskIds": ["id1", "id2"],
  "action": "updatePriority",
  "value": "HIGH"
}

# Bulk reassign (admin only)
POST /api/tasks/bulk
{
  "taskIds": ["id1", "id2"],
  "action": "assignOwner",
  "value": "userId"
}

# Bulk delete (admin only)
POST /api/tasks/bulk
{
  "taskIds": ["id1", "id2"],
  "action": "delete"
}
```

*Note: UI with checkboxes is pending*

---

## 🔗 Task Dependencies (API Only)

### Link Related Tasks:
```bash
# Set dependencies
PATCH /api/tasks/xxx/dependencies
{
  "dependsOn": ["taskId1", "taskId2"]
}
```

### Use Cases:
- "Task B cannot start until Task A is done"
- Project workflow management
- Sequential operations

*Note: Visual dependency graph is pending*

---

## 🔍 Advanced Search (API Only)

### Search Tasks:
```bash
# Text search
GET /api/tasks/search?q=keyword

# Filter by status (repeatable)
GET /api/tasks/search?status=NEW&status=IN_PROGRESS

# Filter by priority
GET /api/tasks/search?priority=HIGH&priority=MEDIUM

# Filter by owner
GET /api/tasks/search?owner=userId1&owner=userId2

# Date range
GET /api/tasks/search?dateFrom=2026-02-01&dateTo=2026-02-28

# Has attachments
GET /api/tasks/search?hasAttachments=true

# Overdue only
GET /api/tasks/search?overdue=true

# Combined filters
GET /api/tasks/search?q=معاملة&status=NEW&priority=HIGH&overdue=true
```

*Note: Search UI with filters panel is pending*

---

## 📊 Dashboard Stats Explained

### My Tasks:
- **الإجمالي** - Total tasks assigned to you
- **جديد** - New tasks (not started)
- **قيد التنفيذ** - Tasks in progress
- **بانتظار** - Tasks on hold
- **مكتمل** - Completed tasks

### Recent Activity:
- Shows last 10 actions across all tasks
- Emoji indicators for action types
- Click task title to jump to it

### Overdue Tasks:
- Tasks past their due date
- Red highlight for urgency
- Empty = "🎉 رائع! لا توجد مهام متأخرة"

### Recent Files:
- Last 5 uploaded files
- Shows file size and task name
- Quick access to recent work

### Team Stats (Admin Only):
- Total tasks in system
- Number of users
- Per-user breakdown by status

---

## 🛠️ Developer API Reference

### Authentication:
All API calls require a valid session cookie.

### Base URL:
```
Production: https://app.albassam-app.com/api
Local: http://localhost:3000/api
```

### Headers:
```
Content-Type: application/json
Cookie: session=... (from login)
```

### Error Handling:
- `401` - Unauthorized (need to login)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `400` - Bad request (validation failed)
- `500` - Server error

### Response Format:
```json
// Success
{
  "ok": true,
  "data": { ... }
}

// Error
{
  "error": "Error message in Arabic or English"
}
```

---

## 🧪 Testing Checklist

### Manual Tests:
- [ ] Login to application
- [ ] Visit `/dashboard` - Check all stats load
- [ ] Create a new task
- [ ] Add a comment to the task
- [ ] Add a comment with @mention
- [ ] View task timeline
- [ ] Use a template (via API if UI pending)
- [ ] Add checklist items
- [ ] Toggle checklist items
- [ ] Check Telegram notifications received

### API Tests (using curl or Postman):
- [ ] GET /api/dashboard
- [ ] GET /api/templates
- [ ] GET /api/tasks/[id]/comments
- [ ] POST /api/tasks/[id]/comments
- [ ] GET /api/tasks/[id]/history
- [ ] PATCH /api/tasks/[id]/checklist
- [ ] GET /api/tasks/search
- [ ] POST /api/tasks/bulk

---

## 🐛 Troubleshooting

### "Comments not showing"
- Refresh the page
- Check browser console for errors
- Verify task ID is correct

### "Cannot add comment"
- Make sure you're logged in
- Check the comment is not empty
- Try without mentions first

### "Dashboard shows wrong stats"
- Stats are real-time from database
- Try logout and login again
- Check if filters are applied

### "Telegram notifications not working"
- Verify telegramId is set in user profile
- Check notifications are enabled
- Look for errors in server logs: `tail -f app.log`

---

## 📞 Getting Help

### Log Files:
```bash
# Application logs
tail -f /data/.openclaw/workspace/albassam-tasks/app.log

# Build logs
npm run build 2>&1 | tee build.log
```

### Database Access:
```bash
# Open Prisma Studio
npx prisma studio

# Access on: http://localhost:5555
```

### Restart Application:
```bash
cd /data/.openclaw/workspace/albassam-tasks
npm start
```

---

## 🎯 Quick Tips

### For Best Experience:
1. **Use Dashboard** as your home page - It shows everything at a glance
2. **Mention people** in comments to notify them instantly
3. **Check Timeline** before asking "what changed?" - It's all logged
4. **Use Templates** for repetitive tasks - Save time and ensure consistency
5. **Leverage Checklists** for complex tasks - Track progress visually

### For Admins:
1. **Monitor Team Stats** in dashboard
2. **Create Templates** for common workflows
3. **Use Bulk Actions** for mass updates (via API)
4. **Check Activity Log** to track team performance

---

## 🎉 Enjoy the New Features!

**Need more features?** Plan Phase 4:
- Full UI integration for all APIs
- Visual dependency graphs
- Advanced analytics
- Mobile app
- More automation

**Questions?** Check:
- `CHANGELOG-Phase3.md` - Detailed feature docs
- `DEPLOYMENT-REPORT.md` - Technical details
- API code in `app/api/` - Implementation reference

---

**Happy Task Managing! 🚀**
