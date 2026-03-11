import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Get attendance correction history (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const history = await prisma.attendanceRequest.findMany({
      where: {
        userId: session.user.id,
        type: 'EXCUSE',
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50,
      select: {
        id: true,
        requestDate: true,
        reason: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        reviewedBy: true,
        attendanceRecordId: true
      }
    });

    // Get reviewer names
    const reviewerIds = history
      .map(h => h.reviewedBy)
      .filter(Boolean) as string[];

    const reviewers = await prisma.user.findMany({
      where: { id: { in: reviewerIds } },
      select: { id: true, displayName: true }
    });

    const reviewerMap = new Map(reviewers.map(r => [r.id, r.displayName]));

    // Get attendance records if available
    const recordIds = history
      .map(h => h.attendanceRecordId)
      .filter(Boolean) as string[];

    const records = await prisma.attendanceRecord.findMany({
      where: { id: { in: recordIds } },
      select: { id: true, status: true, workHours: true }
    });

    const recordMap = new Map(records.map(r => [r.id, r]));

    // Enhance history with reviewer names and attendance records
    const enhancedHistory = history.map(item => ({
      ...item,
      reviewerName: item.reviewedBy ? reviewerMap.get(item.reviewedBy) : null,
      attendanceRecord: item.attendanceRecordId ? recordMap.get(item.attendanceRecordId) : null,
      daysSince: Math.floor((Date.now() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    }));

    // Calculate statistics
    const stats = {
      total: history.length,
      approved: history.filter(h => h.status === 'APPROVED').length,
      rejected: history.filter(h => h.status === 'REJECTED').length,
      pending: history.filter(h => h.status === 'PENDING').length,
      approvalRate: history.length > 0 
        ? ((history.filter(h => h.status === 'APPROVED').length / history.filter(h => h.status !== 'PENDING').length) * 100)
        : 0
    };

    return NextResponse.json({
      history: enhancedHistory,
      stats
    });
  } catch (error) {
    console.error('Error fetching correction history:', error);
    return NextResponse.json(
      { error: 'فشل في جلب السجل' },
      { status: 500 }
    );
  }
}
