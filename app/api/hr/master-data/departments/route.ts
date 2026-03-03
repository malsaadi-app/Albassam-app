import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/hr/master-data/departments
// Lightweight list for pickers.
export async function GET() {
  const deps = await prisma.department.findMany({
    select: { id: true, nameAr: true, nameEn: true },
    orderBy: { nameAr: 'asc' },
  })
  return NextResponse.json({ departments: deps })
}
