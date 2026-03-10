import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

// Workflow Analytics API
// GET: fetch analytics data for workflows
export async function GET(request: NextRequest) {
  const session = await getSession(await cookies())
  if (!session.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const workflowId = searchParams.get('workflowId')

  // Build date filter
  const dateFilter: any = {}
  if (startDate) {
    dateFilter.gte = new Date(startDate)
  }
  if (endDate) {
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    dateFilter.lte = end
  }

  // Build where clause
  const where: any = {}
  if (Object.keys(dateFilter).length > 0) {
    where.createdAt = dateFilter
  }
  if (workflowId && workflowId !== 'all') {
    where.workflowId = workflowId
  }

  try {
    // 1. Total requests count
    const totalCount = await prisma.hRRequest.count({ where })

    // 2. Requests by status
    const statusCounts = await prisma.hRRequest.groupBy({
      by: ['status'],
      where,
      _count: true,
    })

    const statusBreakdown = statusCounts.map((s) => ({
      status: s.status,
      count: s._count,
    }))

    // 3. Requests by type
    const typeCounts = await prisma.hRRequest.groupBy({
      by: ['type'],
      where,
      _count: true,
    })

    const typeBreakdown = typeCounts.map((t) => ({
      type: t.type,
      count: t._count,
    }))

    // 4. Average approval time (for completed requests)
    const completedRequests = await prisma.hRRequest.findMany({
      where: {
        ...where,
        status: { in: ['APPROVED', 'REJECTED'] },
        reviewedAt: { not: null },
      },
      select: {
        createdAt: true,
        reviewedAt: true,
      },
    })

    let avgApprovalTimeHours = 0
    if (completedRequests.length > 0) {
      const totalMs = completedRequests.reduce((sum, req) => {
        if (!req.reviewedAt) return sum
        return sum + (req.reviewedAt.getTime() - req.createdAt.getTime())
      }, 0)
      avgApprovalTimeHours = totalMs / completedRequests.length / (1000 * 60 * 60)
    }

    // 5. Approval rate
    const approvedCount = statusBreakdown.find((s) => s.status === 'APPROVED')?.count || 0
    const rejectedCount = statusBreakdown.find((s) => s.status === 'REJECTED')?.count || 0
    const decidedCount = approvedCount + rejectedCount
    const approvalRate = decidedCount > 0 ? (approvedCount / decidedCount) * 100 : 0

    // 6. Timeline data (requests per day for last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const timelineRequests = await prisma.hRRequest.findMany({
      where: {
        ...where,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Group by date
    const timelineMap = new Map<string, { date: string; count: number }>()
    timelineRequests.forEach((req) => {
      const dateKey = req.createdAt.toISOString().split('T')[0]
      if (!timelineMap.has(dateKey)) {
        timelineMap.set(dateKey, { date: dateKey, count: 0 })
      }
      timelineMap.get(dateKey)!.count++
    })

    const timeline = Array.from(timelineMap.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    )

    // 7. Most used workflows
    const workflowCounts = await prisma.hRRequest.groupBy({
      by: ['type'],
      where,
      _count: true,
    })

    // Sort manually and take top 5
    const topWorkflows = workflowCounts
      .map((w) => ({
        type: w.type,
        count: w._count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // 8. Recent requests (last 10)
    const recentRequests = await prisma.hRRequest.findMany({
      where,
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true,
        employee: {
          select: {
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      ok: true,
      analytics: {
        summary: {
          totalCount,
          avgApprovalTimeHours: Math.round(avgApprovalTimeHours * 10) / 10,
          approvalRate: Math.round(approvalRate * 10) / 10,
        },
        statusBreakdown,
        typeBreakdown,
        timeline,
        topWorkflows,
        recentRequests,
      },
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'فشل في جلب البيانات' },
      { status: 500 }
    )
  }
}
