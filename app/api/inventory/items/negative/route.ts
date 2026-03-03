import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

// GET /api/inventory/items/negative
// List items with negative stock (overdraft) to clean up inventory data.
export async function GET() {
  const session = await getSession(await cookies())
  if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const items = await prisma.stockItem.findMany({
    where: { currentStock: { lt: 0 } },
    orderBy: [{ currentStock: 'asc' }, { updatedAt: 'desc' }],
    take: 200,
  })

  return NextResponse.json({ items })
}
