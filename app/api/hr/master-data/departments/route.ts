import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/hr/master-data/departments?branchId=...
// Returns departments from OrgUnit table
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const branchId = searchParams.get('branchId')

  const deps = await prisma.orgUnit.findMany({
    where: {
      type: 'DEPARTMENT',
      ...(branchId ? { branchId } : {}),
    },
    select: { 
      id: true, 
      name: true,
      branchId: true,
    },
    orderBy: { name: 'asc' },
  })
  
  // Map to expected format (nameAr for compatibility)
  const formatted = deps.map(d => ({
    id: d.id,
    nameAr: d.name,
    nameEn: d.name,
  }))
  
  return NextResponse.json({ departments: formatted })
}
