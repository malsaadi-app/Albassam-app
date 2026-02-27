import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
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

  const history = await prisma.activityLog.findMany({
    where: { taskId: id },
    include: {
      user: {
        select: { username: true, displayName: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ history })
}
