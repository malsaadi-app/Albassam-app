import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/hr/request-types
// Returns request types that have an HRRequestTypeWorkflow configured.
export async function GET() {
  const rows = await prisma.hRRequestTypeWorkflow.findMany({
    select: { requestType: true },
    orderBy: { requestType: 'asc' },
  })

  const types = Array.from(new Set(rows.map((r) => String(r.requestType))))
  return NextResponse.json({ types })
}
