import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { isAdmin } from '@/lib/authz'
import { TaskStatus } from '@prisma/client'

function requireUser(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function GET() {
  const cookieStore = await cookies()
  const session = await getSession(cookieStore)
  const unauthorized = requireUser(session)
  if (unauthorized) return unauthorized

  const user = session.user!

  // My Tasks Stats
  const myTasksWhere = { ownerId: user.id }
  
  const myTasksStats = {
    total: await prisma.task.count({ where: myTasksWhere }),
    new: await prisma.task.count({ 
      where: { ...myTasksWhere, status: TaskStatus.NEW } 
    }),
    inProgress: await prisma.task.count({ 
      where: { ...myTasksWhere, status: TaskStatus.IN_PROGRESS } 
    }),
    onHold: await prisma.task.count({ 
      where: { ...myTasksWhere, status: TaskStatus.ON_HOLD } 
    }),
    done: await prisma.task.count({ 
      where: { ...myTasksWhere, status: TaskStatus.DONE } 
    })
  }

  // Recent Activity
  const recentActivity = await prisma.activityLog.findMany({
    where: isAdmin(user.role) 
      ? {} // Admins see all activity
      : { 
          task: { ownerId: user.id } // Users see activity on their tasks
        },
    include: {
      user: {
        select: { username: true, displayName: true }
      },
      task: {
        select: { id: true, title: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  // Overdue Tasks
  const overdueTasks = await prisma.task.findMany({
    where: {
      ownerId: user.id,
      dueDate: { lt: new Date() },
      status: { not: TaskStatus.DONE }
    },
    include: {
      owner: {
        select: { username: true, displayName: true }
      }
    },
    orderBy: { dueDate: 'asc' },
    take: 5
  })

  // Recent Files (from task attachments)
  const tasksWithAttachments = await prisma.task.findMany({
    where: {
      ownerId: user.id,
      attachments: { not: null }
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      title: true,
      attachments: true,
      updatedAt: true
    }
  })

  const recentFiles = tasksWithAttachments.flatMap(task => {
    try {
      const attachments = JSON.parse(task.attachments || '[]')
      return attachments.map((file: any) => ({
        ...file,
        taskId: task.id,
        taskTitle: task.title
      }))
    } catch {
      return []
    }
  }).slice(0, 5)

  // Team Stats (Admin only)
  let teamStats = null
  if (isAdmin(user.role)) {
    const allUsers = await prisma.user.findMany({
      select: { id: true, username: true, displayName: true }
    })

    const teamTaskCounts = await Promise.all(
      allUsers.map(async (u) => ({
        user: u,
        total: await prisma.task.count({ where: { ownerId: u.id } }),
        new: await prisma.task.count({ 
          where: { ownerId: u.id, status: TaskStatus.NEW } 
        }),
        inProgress: await prisma.task.count({ 
          where: { ownerId: u.id, status: TaskStatus.IN_PROGRESS } 
        }),
        done: await prisma.task.count({ 
          where: { ownerId: u.id, status: TaskStatus.DONE } 
        })
      }))
    )

    teamStats = {
      totalTasks: await prisma.task.count(),
      totalUsers: allUsers.length,
      userBreakdown: teamTaskCounts
    }
  }

  return NextResponse.json({
    myTasksStats,
    recentActivity,
    overdueTasks,
    recentFiles,
    teamStats
  })
}
