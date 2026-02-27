import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

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

  // Refresh session
  await session.save()

  const templates = await prisma.taskTemplate.findMany({
    orderBy: { name: 'asc' }
  })

  return NextResponse.json({ templates })
}
