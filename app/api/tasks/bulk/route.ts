import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { isAdmin } from '@/lib/authz'
import { TaskStatus, TaskPriority } from '@prisma/client'

function requireUser(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

const BulkActionSchema = z.object({
  taskIds: z.array(z.string()).min(1),
  action: z.enum(['updateStatus', 'updatePriority', 'assignOwner', 'delete', 'archive']),
  value: z.any().optional() // status, priority, or ownerId depending on action
})

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const session = await getSession(cookieStore)
  const unauthorized = requireUser(session)
  if (unauthorized) return unauthorized

  const user = session.user!

  const payload = await req.json().catch(() => null)
  const parsed = BulkActionSchema.safeParse(payload)
  
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { taskIds, action, value } = parsed.data

  // Get all tasks and check permissions
  const tasks = await prisma.task.findMany({
    where: { id: { in: taskIds } }
  })

  if (tasks.length === 0) {
    return NextResponse.json({ error: 'No tasks found' }, { status: 404 })
  }

  // Check if user has permission for all tasks
  const hasPermission = tasks.every(task => 
    isAdmin(user.role) || task.ownerId === user.id
  )

  if (!hasPermission) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission for some tasks' }, { status: 403 })
  }

  // Perform bulk action
  let result: any = null

  switch (action) {
    case 'updateStatus':
      if (!Object.values(TaskStatus).includes(value)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
      }
      result = await prisma.task.updateMany({
        where: { id: { in: taskIds } },
        data: { status: value, updatedAt: new Date() }
      })
      // Log activity for each task
      for (const taskId of taskIds) {
        await prisma.activityLog.create({
          data: {
            taskId,
            userId: user.id,
            action: 'status_changed',
            changes: JSON.stringify({ status: { to: value } })
          }
        })
      }
      break

    case 'updatePriority':
      if (!Object.values(TaskPriority).includes(value)) {
        return NextResponse.json({ error: 'Invalid priority value' }, { status: 400 })
      }
      result = await prisma.task.updateMany({
        where: { id: { in: taskIds } },
        data: { priority: value, updatedAt: new Date() }
      })
      // Log activity for each task
      for (const taskId of taskIds) {
        await prisma.activityLog.create({
          data: {
            taskId,
            userId: user.id,
            action: 'priority_changed',
            changes: JSON.stringify({ priority: { to: value } })
          }
        })
      }
      break

    case 'assignOwner':
      if (!isAdmin(user.role)) {
        return NextResponse.json({ error: 'Only admins can reassign tasks' }, { status: 403 })
      }
      // Verify owner exists
      const owner = await prisma.user.findUnique({ where: { id: value } })
      if (!owner) {
        return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
      }
      result = await prisma.task.updateMany({
        where: { id: { in: taskIds } },
        data: { ownerId: value, updatedAt: new Date() }
      })
      // Log activity for each task
      for (const taskId of taskIds) {
        await prisma.activityLog.create({
          data: {
            taskId,
            userId: user.id,
            action: 'owner_changed',
            changes: JSON.stringify({ owner: { to: owner.displayName } })
          }
        })
      }
      break

    case 'delete':
      // Only admin can bulk delete
      if (!isAdmin(user.role)) {
        return NextResponse.json({ error: 'Only admins can delete tasks' }, { status: 403 })
      }
      result = await prisma.task.deleteMany({
        where: { id: { in: taskIds } }
      })
      break

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  return NextResponse.json({ 
    ok: true, 
    count: result?.count || taskIds.length,
    action 
  })
}
