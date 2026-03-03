import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/hr/master-data/departments?branchId=...
// If branchId is provided, returns only departments used by employees in that branch.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const branchId = searchParams.get('branchId')

  const deps = await prisma.department.findMany({
    where: branchId
      ? {
          employees: {
            some: {
              branchId,
            },
          },
        }
      : undefined,
    select: { id: true, nameAr: true, nameEn: true },
    orderBy: { nameAr: 'asc' },
  })
  return NextResponse.json({ departments: deps })
}
