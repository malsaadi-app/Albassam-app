import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { getEnhancedDashboardData } from '@/lib/dashboard/enhanced'

export async function GET() {
  const session = await getSession(await cookies())

  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await getEnhancedDashboardData(session.user)
  return NextResponse.json(data)
}
