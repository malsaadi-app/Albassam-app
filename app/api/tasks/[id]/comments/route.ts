import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

function requireUser(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const session = await getSession(cookieStore)
  const unauthorized = requireUser(session)
  if (unauthorized) return unauthorized

  const { id } = await params
  
  // Refresh session
  await session.save()

  const comments = await prisma.comment.findMany({
    where: { taskId: id },
    include: {
      user: {
        select: { username: true, displayName: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  return NextResponse.json({ comments })
}

const CreateCommentBody = z.object({
  content: z.string().min(1).max(1000),
  mentions: z.array(z.string()).optional()
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const session = await getSession(cookieStore)
  const unauthorized = requireUser(session)
  if (unauthorized) return unauthorized

  const user = session.user!
  const { id: taskId } = await params

  // Refresh session
  await session.save()

  const json = await req.json().catch(() => null)
  const parsed = CreateCommentBody.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { content, mentions } = parsed.data

  const comment = await prisma.comment.create({
    data: {
      taskId,
      userId: user.id,
      content,
      mentions: mentions ? JSON.stringify(mentions) : null
    },
    include: {
      user: {
        select: { username: true, displayName: true }
      }
    }
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      taskId,
      userId: user.id,
      action: 'commented',
      changes: JSON.stringify({ comment: content.substring(0, 100) })
    }
  })

  return NextResponse.json({ comment })
}
