import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { isAdmin } from '@/lib/authz'
import { TaskStatus, TaskPriority, TaskCategory } from '@prisma/client'

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

  const user = session.user!
  const { searchParams } = new URL(req.url)

  // Build where clause
  const where: any = {}

  // Permission filter
  if (isAdmin(user.role)) {
    where.OR = [
      { isPrivate: false },
      { isPrivate: true, ownerId: user.id }
    ]
  } else {
    where.ownerId = user.id
  }

  // Search query (title + description)
  const query = searchParams.get('q')
  if (query) {
    where.OR = [
      { title: { contains: query } },
      { description: { contains: query } }
    ]
  }

  // Status filter
  const statuses = searchParams.getAll('status')
  if (statuses.length > 0) {
    where.status = { in: statuses as TaskStatus[] }
  }

  // Priority filter
  const priorities = searchParams.getAll('priority')
  if (priorities.length > 0) {
    where.priority = { in: priorities as TaskPriority[] }
  }

  // Category filter
  const categories = searchParams.getAll('category')
  if (categories.length > 0) {
    where.category = { in: categories as TaskCategory[] }
  }

  // Owner filter
  const owners = searchParams.getAll('owner')
  if (owners.length > 0) {
    where.ownerId = { in: owners }
  }

  // Date range filter
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom)
    if (dateTo) where.createdAt.lte = new Date(dateTo)
  }

  // Has attachments filter
  const hasAttachments = searchParams.get('hasAttachments')
  if (hasAttachments === 'true') {
    where.attachments = { not: null }
  } else if (hasAttachments === 'false') {
    where.attachments = null
  }

  // Overdue filter
  const overdue = searchParams.get('overdue')
  if (overdue === 'true') {
    where.dueDate = { lt: new Date() }
    where.status = { not: TaskStatus.DONE }
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      owner: {
        select: { id: true, username: true, displayName: true }
      },
      createdBy: {
        select: { username: true }
      }
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' }
    ]
  })

  return NextResponse.json({ tasks })
}
