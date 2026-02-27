import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { isAdmin } from '@/lib/authz'

function requireUser(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

const UpdateDependenciesSchema = z.object({
  dependsOn: z.array(z.string())
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const session = await getSession(cookieStore)
  const unauthorized = requireUser(session)
  if (unauthorized) return unauthorized

  const user = session.user!
  const { id: taskId } = await params

  // Check if task exists and user has permission
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  // Only admin or owner can edit
  if (!isAdmin(user.role) && task.ownerId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const payload = await req.json().catch(() => null)
  const parsed = UpdateDependenciesSchema.safeParse(payload)
  
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { dependsOn } = parsed.data

  // Validate that all dependency tasks exist
  if (dependsOn.length > 0) {
    const dependencyTasks = await prisma.task.findMany({
      where: { id: { in: dependsOn } }
    })
    if (dependencyTasks.length !== dependsOn.length) {
      return NextResponse.json({ error: 'Invalid dependency task IDs' }, { status: 400 })
    }
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      dependsOn: dependsOn.length > 0 ? JSON.stringify(dependsOn) : null,
      updatedAt: new Date()
    }
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      taskId,
      userId: user.id,
      action: 'dependencies_updated',
      changes: JSON.stringify({ dependsOn })
    }
  })

  return NextResponse.json({ ok: true, dependsOn })
}
