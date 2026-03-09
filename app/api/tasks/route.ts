import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { isAdmin } from '@/lib/authz'
import { TaskCategory, TaskStatus, TaskPriority } from '@prisma/client'
import { sendTelegramNotification, notifyAdminOfStatusChange } from '@/lib/telegram'

function requireUser(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function GET(req: Request) {
  const cookieStore = await cookies()
  const session = await getSession(cookieStore)
  const unauthorized = requireUser(session)
  if (unauthorized) return unauthorized

  // Refresh session
  await session.save()

  const user = session.user!

  // Get view parameter (my / team / all)
  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view') || 'my' // default: my tasks

  // Build where clause based on view
  let where: any = {}

  if (view === 'my') {
    // My tasks: tasks I own or am assigned to
    where = {
      OR: [
        { ownerId: user.id },
        { assignees: { some: { userId: user.id } } }
      ]
    }
  } else if (view === 'team') {
    // Team tasks: tasks I can see but don't own/assigned
    if (isAdmin(user.role)) {
      where = {
        AND: [
          { isPrivate: false },
          { ownerId: { not: user.id } },
          { NOT: { assignees: { some: { userId: user.id } } } }
        ]
      }
    } else {
      // Non-admins see no team tasks
      where = { id: 'impossible-id-no-results' }
    }
  } else {
    // All tasks (admin only)
    where = isAdmin(user.role)
      ? {
          OR: [{ isPrivate: false }, { isPrivate: true, ownerId: user.id }]
        }
      : { ownerId: user.id }
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      owner: {
        select: { username: true }
      },
      assignees: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              employee: {
                select: {
                  fullNameAr: true,
                  employeeNumber: true,
                  position: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Get all users for admin to assign tasks
  const users = isAdmin(user.role) 
    ? await prisma.user.findMany({
        select: { 
          id: true, 
          username: true,
          displayName: true,
          employee: {
            select: {
              fullNameAr: true,
              employeeNumber: true,
              position: true
            }
          }
        }
      })
    : []

  return NextResponse.json({ 
    tasks, 
    users,
    user: {
      username: user.username,
      role: user.role
    }
  })
}

const CreateBody = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  category: z.nativeEnum(TaskCategory),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  isPrivate: z.boolean().optional(),
  ownerId: z.string().optional(),
  checklist: z.string().optional().nullable(),
  assigneeIds: z.array(z.string()).optional()
})

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const session = await getSession(cookieStore)
  const unauthorized = requireUser(session)
  if (unauthorized) return unauthorized

  // Refresh session
  await session.save()

  const user = session.user!

  // Supports form posts from the server-rendered page, and JSON.
  const contentType = req.headers.get('content-type') || ''
  let payload: any = null

  if (contentType.includes('application/json')) {
    payload = await req.json().catch(() => null)
  } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const fd = await req.formData()
    payload = {
      title: String(fd.get('title') || ''),
      description: fd.get('description') ? String(fd.get('description')) : null,
      category: String(fd.get('category') || 'TRANSACTIONS'),
      status: String(fd.get('status') || 'NEW'),
      isPrivate: fd.get('isPrivate') ? true : false
    }
  }

  const parsed = CreateBody.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { title, description, category, priority, status, isPrivate, ownerId, checklist, assigneeIds } = parsed.data

  // Admin can assign to anyone, employees can only create for themselves
  const finalOwnerId = (isAdmin(user.role) && ownerId) ? ownerId : user.id
  
  // Private tasks: allow only admins for MVP.
  const finalPrivate = Boolean(isPrivate && isAdmin(user.role))

  const newTask = await prisma.task.create({
    data: {
      title,
      description: description || null,
      category,
      priority: priority ?? TaskPriority.MEDIUM,
      status: status ?? TaskStatus.NEW,
      isPrivate: finalPrivate,
      ownerId: finalOwnerId,
      createdById: user.id,
      checklist: checklist || null
    }
  })

  // Add assignees if provided
  if (assigneeIds && assigneeIds.length > 0 && isAdmin(user.role)) {
    await prisma.taskAssignee.createMany({
      data: assigneeIds.map(userId => ({
        taskId: newTask.id,
        userId
      })),
      skipDuplicates: true
    })

    // Send notifications to all assignees
    for (const assigneeId of assigneeIds) {
      if (assigneeId !== user.id) {
        await sendTelegramNotification({
          type: 'TASK_ASSIGNED',
          userId: assigneeId,
          taskTitle: title,
          taskId: newTask.id,
          assignedBy: user.username
        }).catch(err => console.error('Failed to send notification:', err));
      }
    }
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      taskId: newTask.id,
      userId: user.id,
      action: 'created',
      changes: JSON.stringify({ 
        title, 
        category, 
        status: status ?? TaskStatus.NEW,
        owner: finalOwnerId !== user.id ? finalOwnerId : null,
        assignees: assigneeIds || []
      })
    }
  })

  // Send Telegram notification if task is assigned to owner (backward compatibility)
  if (finalOwnerId !== user.id && (!assigneeIds || !assigneeIds.includes(finalOwnerId))) {
    await sendTelegramNotification({
      type: 'TASK_ASSIGNED',
      userId: finalOwnerId,
      taskTitle: title,
      taskId: newTask.id,
      assignedBy: user.username
    }).catch(err => console.error('Failed to send notification:', err));
  }

  // If form post, redirect back to /tasks
  if (!contentType.includes('application/json')) {
    return NextResponse.redirect(new URL('/tasks', process.env.APP_URL || 'http://localhost:3000'))
  }

  return NextResponse.json({ ok: true })
}

const UpdateBody = z.object({
  taskId: z.string(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  category: z.nativeEnum(TaskCategory).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  isPrivate: z.boolean().optional(),
  ownerId: z.string().optional(),
  checklist: z.string().optional().nullable()
})

export async function PATCH(req: Request) {
  const cookieStore = await cookies()
  const session = await getSession(cookieStore)
  const unauthorized = requireUser(session)
  if (unauthorized) return unauthorized

  // Refresh session
  await session.save()

  const user = session.user!
  const payload = await req.json().catch(() => null)
  const parsed = UpdateBody.safeParse(payload)
  
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { taskId, ...updates } = parsed.data

  // Check if task exists and user has permission
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  // Only admin or owner can edit
  if (!isAdmin(user.role) && task.ownerId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update task
  const updateData: any = {}
  if (updates.title !== undefined) updateData.title = updates.title
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.category !== undefined) updateData.category = updates.category
  if (updates.priority !== undefined) updateData.priority = updates.priority
  if (updates.status !== undefined) updateData.status = updates.status
  if (updates.checklist !== undefined) updateData.checklist = updates.checklist
  if (updates.isPrivate !== undefined && isAdmin(user.role)) {
    updateData.isPrivate = updates.isPrivate
  }
  
  // Track if owner is changing for notification
  const ownerChanging = updates.ownerId !== undefined && updates.ownerId !== task.ownerId && isAdmin(user.role);
  const newOwnerId = updates.ownerId;
  
  // Admin can reassign task to another user
  if (updates.ownerId !== undefined && isAdmin(user.role)) {
    updateData.ownerId = updates.ownerId
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: updateData
  })

  // Log activity for changes
  const changes: any = {}
  if (updates.title !== undefined) changes.title = { from: task.title, to: updates.title }
  if (updates.description !== undefined) changes.description = { from: task.description, to: updates.description }
  if (updates.category !== undefined) changes.category = { from: task.category, to: updates.category }
  if (updates.priority !== undefined) changes.priority = { from: task.priority, to: updates.priority }
  if (updates.status !== undefined) changes.status = { from: task.status, to: updates.status }
  if (updates.checklist !== undefined) changes.checklist = { from: task.checklist, to: updates.checklist }
  if (updates.ownerId !== undefined && isAdmin(user.role)) changes.owner = { from: task.ownerId, to: updates.ownerId }
  
  if (Object.keys(changes).length > 0) {
    await prisma.activityLog.create({
      data: {
        taskId,
        userId: user.id,
        action: 'updated',
        changes: JSON.stringify(changes)
      }
    })
  }

  // Send notifications
  // 1. If task is reassigned, notify new owner
  if (ownerChanging && newOwnerId) {
    await sendTelegramNotification({
      type: 'TASK_ASSIGNED',
      userId: newOwnerId,
      taskTitle: task.title,
      taskId: task.id,
      assignedBy: user.username
    });
  }

  // 2. If status changed and user is not admin, notify admins
  if (updates.status !== undefined && updates.status !== task.status && !isAdmin(user.role)) {
    await notifyAdminOfStatusChange(
      task.id,
      task.title,
      updates.status,
      user.username
    );
  }

  return NextResponse.json({ ok: true })
}
