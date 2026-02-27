import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/authz'
import type { SessionUser } from '@/lib/session'
import { TaskStatus } from '@prisma/client'

export type EnhancedDashboardData = {
  myTasksStats: {
    total: number
    new: number
    inProgress: number
    onHold: number
    done: number
    overdue: number
  }
  hrRequestsStats: null | {
    pendingReview: number
    pendingApproval: number
    approvedThisMonth: number
    rejectedThisMonth: number
  }
  employeesStats: null | {
    total: number
    onLeaveToday: number
    lowLeaveBalance: number
  }
  attendanceStats: {
    today: null | {
      status: string
      checkIn: string
      checkOut: string | null
      workHours: number | null
    }
    week: {
      daysPresent: number
      totalHours: number
    }
    month: {
      workDays: number
      presentDays: number
      lateDays: number
      attendanceRate: number
    }
  }
  recentActivity: Array<{
    id: string
    type: 'task' | 'request'
    action: string
    title: string
    user: string
    createdAt: string
    itemId: string
  }>
  alerts: {
    overdueTasks: number
    oldPendingRequests: number
    zeroLeaveBalance: number
    dueSoon: number
  }
  charts: {
    tasksByStatus: { label: string; count: number }[]
    requestsTimeline: { date: string; submitted: number; approved: number }[]
    topRequestTypes: { type: string; count: number }[]
    completionTrend: { date: string; rate: number }[]
  }
}

function getDateDaysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(0, 0, 0, 0)
  return date
}

function isOlderThan48Hours(date: Date): boolean {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  return diff > 48 * 60 * 60 * 1000
}

function getActionArabic(action: string): string {
  const actions: Record<string, string> = {
    created: 'أنشأ',
    updated: 'حدّث',
    status_changed: 'غيّر الحالة',
    priority_changed: 'غيّر الأولوية',
    owner_changed: 'غيّر المالك'
  }
  return actions[action] || action
}

function getRequestTypeArabic(type: string): string {
  const types: Record<string, string> = {
    LEAVE: 'إجازة',
    TICKET_ALLOWANCE: 'بدل تذاكر',
    FLIGHT_BOOKING: 'حجز طيران',
    SALARY_CERTIFICATE: 'تعريف بالراتب',
    HOUSING_ALLOWANCE: 'بدل سكن'
  }
  return types[type] || type
}

export async function getEnhancedDashboardData(user: SessionUser): Promise<EnhancedDashboardData> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // === TASKS STATS ===
  const myTasksWhere = { ownerId: user.id }

  const [totalTasks, newTasks, inProgressTasks, onHoldTasks, doneTasks, overdueTasks] = await Promise.all([
    prisma.task.count({ where: myTasksWhere }),
    prisma.task.count({ where: { ...myTasksWhere, status: TaskStatus.NEW } }),
    prisma.task.count({ where: { ...myTasksWhere, status: TaskStatus.IN_PROGRESS } }),
    prisma.task.count({ where: { ...myTasksWhere, status: TaskStatus.ON_HOLD } }),
    prisma.task.count({ where: { ...myTasksWhere, status: TaskStatus.DONE } }),
    prisma.task.count({
      where: {
        ...myTasksWhere,
        dueDate: { lt: now },
        status: { not: TaskStatus.DONE }
      }
    })
  ])

  const myTasksStats = {
    total: totalTasks,
    new: newTasks,
    inProgress: inProgressTasks,
    onHold: onHoldTasks,
    done: doneTasks,
    overdue: overdueTasks
  }

  // === HR REQUESTS STATS ===
  let hrRequestsStats: EnhancedDashboardData['hrRequestsStats'] = null
  if (user.role === 'HR_EMPLOYEE' || user.role === 'ADMIN') {
    const [pendingReview, pendingApproval, approvedThisMonth, rejectedThisMonth] = await Promise.all([
      prisma.hRRequest.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.hRRequest.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.hRRequest.count({ where: { status: 'APPROVED', approvedAt: { gte: startOfMonth } } }),
      prisma.hRRequest.count({ where: { status: 'REJECTED', approvedAt: { gte: startOfMonth } } })
    ])

    hrRequestsStats = {
      pendingReview,
      pendingApproval,
      approvedThisMonth,
      rejectedThisMonth
    }
  }

  // === EMPLOYEES STATS ===
  let employeesStats: EnhancedDashboardData['employeesStats'] = null
  if (user.role === 'ADMIN') {
    const [totalEmployees, onLeaveToday, lowLeaveBalance] = await Promise.all([
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.employee.count({ where: { status: 'ON_LEAVE' } }),
      prisma.leaveBalance.count({ where: { year: now.getFullYear(), annualRemaining: { lt: 5 } } })
    ])

    employeesStats = {
      total: totalEmployees,
      onLeaveToday,
      lowLeaveBalance
    }
  }

  // === RECENT ACTIVITY ===
  const recentActivity: EnhancedDashboardData['recentActivity'] = []

  const taskActivities = await prisma.activityLog.findMany({
    where: isAdmin(user.role) ? {} : { task: { ownerId: user.id } },
    include: {
      user: { select: { displayName: true } },
      task: { select: { id: true, title: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  for (const activity of taskActivities) {
    recentActivity.push({
      id: activity.id,
      type: 'task',
      action: getActionArabic(activity.action),
      title: activity.task.title,
      user: activity.user.displayName,
      createdAt: activity.createdAt.toISOString(),
      itemId: activity.task.id
    })
  }

  if (user.role === 'HR_EMPLOYEE' || user.role === 'ADMIN') {
    const requestActivities = await prisma.hRRequest.findMany({
      where:
        user.role === 'ADMIN'
          ? {}
          : {
              OR: [{ status: 'PENDING_REVIEW' }, { reviewedBy: user.id }]
            },
      include: {
        employee: { select: { displayName: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    for (const req of requestActivities) {
      recentActivity.push({
        id: req.id,
        type: 'request',
        action: 'قدم طلب',
        title: `${getRequestTypeArabic(req.type)}: ${req.employee.displayName}`,
        user: req.employee.displayName,
        createdAt: req.createdAt.toISOString(),
        itemId: req.id
      })
    }
  }

  recentActivity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const topRecentActivity = recentActivity.slice(0, 10)

  // === ATTENDANCE STATS ===
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayAttendance = await prisma.attendanceRecord.findFirst({
    where: { userId: user.id, date: { gte: today, lt: tomorrow } },
    orderBy: { createdAt: 'desc' }
  })

  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  const weekAttendance = await prisma.attendanceRecord.findMany({
    where: { userId: user.id, date: { gte: weekStart, lt: weekEnd } }
  })

  const weekWorkHours = weekAttendance.reduce((sum, record) => sum + (record.workHours || 0), 0)
  const weekDaysPresent = weekAttendance.length

  const monthAttendance = await prisma.attendanceRecord.findMany({
    where: {
      userId: user.id,
      date: { gte: startOfMonth, lt: new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1) }
    }
  })

  const monthWorkDays = monthAttendance.length
  const monthPresentDays = monthAttendance.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length
  const monthLateDays = monthAttendance.filter((r) => r.status === 'LATE').length
  const monthAttendanceRate = monthWorkDays > 0 ? Math.round((monthPresentDays / monthWorkDays) * 100) : 0

  const attendanceStats: EnhancedDashboardData['attendanceStats'] = {
    today: todayAttendance
      ? {
          status: todayAttendance.status,
          checkIn: todayAttendance.checkIn.toISOString(),
          checkOut: todayAttendance.checkOut ? todayAttendance.checkOut.toISOString() : null,
          workHours: todayAttendance.workHours
        }
      : null,
    week: {
      daysPresent: weekDaysPresent,
      totalHours: parseFloat(weekWorkHours.toFixed(2))
    },
    month: {
      workDays: monthWorkDays,
      presentDays: monthPresentDays,
      lateDays: monthLateDays,
      attendanceRate: monthAttendanceRate
    }
  }

  // === ALERTS ===
  const dueSoonTasks = await prisma.task.count({
    where: {
      ownerId: user.id,
      dueDate: { gte: now, lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
      status: { not: TaskStatus.DONE }
    }
  })

  let oldPendingRequests = 0
  let zeroLeaveBalance = 0

  if (user.role === 'HR_EMPLOYEE' || user.role === 'ADMIN') {
    const oldRequests = await prisma.hRRequest.findMany({
      where: { status: { in: ['PENDING_REVIEW', 'PENDING_APPROVAL'] } },
      select: { createdAt: true }
    })

    oldPendingRequests = oldRequests.filter((r) => isOlderThan48Hours(r.createdAt)).length
  }

  if (user.role === 'ADMIN') {
    zeroLeaveBalance = await prisma.leaveBalance.count({ where: { year: now.getFullYear(), annualRemaining: 0 } })
  }

  const alerts = {
    overdueTasks,
    oldPendingRequests,
    zeroLeaveBalance,
    dueSoon: dueSoonTasks
  }

  // === CHARTS DATA ===
  const tasksByStatus = [
    { label: 'NEW', count: newTasks },
    { label: 'IN_PROGRESS', count: inProgressTasks },
    { label: 'ON_HOLD', count: onHoldTasks },
    { label: 'DONE', count: doneTasks }
  ]

  const requestsTimeline: EnhancedDashboardData['charts']['requestsTimeline'] = []
  if (user.role === 'HR_EMPLOYEE' || user.role === 'ADMIN') {
    for (let i = 6; i >= 0; i--) {
      const date = getDateDaysAgo(i)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const [submitted, approved] = await Promise.all([
        prisma.hRRequest.count({ where: { createdAt: { gte: date, lt: nextDate } } }),
        prisma.hRRequest.count({ where: { status: 'APPROVED', approvedAt: { gte: date, lt: nextDate } } })
      ])

      requestsTimeline.push({ date: date.toISOString(), submitted, approved })
    }
  }

  const topRequestTypes: EnhancedDashboardData['charts']['topRequestTypes'] = []
  if (user.role === 'HR_EMPLOYEE' || user.role === 'ADMIN') {
    const requestTypes: Array<'LEAVE' | 'TICKET_ALLOWANCE' | 'FLIGHT_BOOKING' | 'SALARY_CERTIFICATE' | 'HOUSING_ALLOWANCE'> = [
      'LEAVE',
      'TICKET_ALLOWANCE',
      'FLIGHT_BOOKING',
      'SALARY_CERTIFICATE',
      'HOUSING_ALLOWANCE'
    ]

    for (const type of requestTypes) {
      const count = await prisma.hRRequest.count({ where: { type: type as any } })
      topRequestTypes.push({ type, count })
    }

    topRequestTypes.sort((a, b) => b.count - a.count)
  }

  const completionTrend: EnhancedDashboardData['charts']['completionTrend'] = []
  for (let i = 29; i >= 0; i--) {
    const date = getDateDaysAgo(i)
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)

    const [total, completed] = await Promise.all([
      prisma.task.count({ where: { ownerId: user.id, createdAt: { lte: nextDate } } }),
      prisma.task.count({ where: { ownerId: user.id, status: TaskStatus.DONE, createdAt: { lte: nextDate } } })
    ])

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0
    completionTrend.push({ date: date.toISOString(), rate })
  }

  return {
    myTasksStats,
    hrRequestsStats,
    employeesStats,
    attendanceStats,
    recentActivity: topRecentActivity,
    alerts,
    charts: {
      tasksByStatus,
      requestsTimeline,
      topRequestTypes,
      completionTrend
    }
  }
}
