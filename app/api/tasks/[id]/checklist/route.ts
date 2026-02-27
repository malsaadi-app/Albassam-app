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

const UpdateChecklistBody = z.object({
  checklist: z.array(
    z.object({
      text: z.string(),
      completed: z.boolean()
    })
  )
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const session = await getSession(cookieStore)
  const unauthorized = requireUser(session)
  if (unauthorized) return unauthorized

  const user = session.user!
  const { id: taskId } = await params

  // Refresh session
  await session.save()

  const json = await req.json().catch(() => null)
  const parsed = UpdateChecklistBody.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { checklist } = parsed.data

  // Check if task exists and user has permission
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  // Only admin or owner can edit
  if (!isAdmin(user.role) && task.ownerId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      checklist: JSON.stringify(checklist)
    }
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      taskId,
      userId: user.id,
      action: 'updated',
      changes: JSON.stringify({ checklist: 'updated' })
    }
  })

  return NextResponse.json({ ok: true, task: updatedTask })
}
