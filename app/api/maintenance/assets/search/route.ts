import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { cookies } from 'next/headers'

// GET /api/maintenance/assets/search?q=...
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '10')))

    if (!q) return NextResponse.json({ assets: [] })

    const assets = await prisma.asset.findMany({
      where: {
        OR: [{ assetNumber: { contains: q } }, { name: { contains: q } }, { serialNumber: { contains: q } }]
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        assetNumber: true,
        name: true,
        type: true,
        serialNumber: true,
        branchId: true,
        stageId: true
      }
    })

    return NextResponse.json({ assets })
  } catch (e) {
    console.error('GET /api/maintenance/assets/search error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء البحث' }, { status: 500 })
  }
}
