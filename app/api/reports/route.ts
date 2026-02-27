import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    // Check if user is logged in
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Refresh session
    await session.save();

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });

    // Only admin can access reports
    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const whereClause = Object.keys(dateFilter).length > 0 
      ? { createdAt: dateFilter } 
      : {};

    // Get all tasks with filters
    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        owner: { select: { id: true, username: true, displayName: true } },
        createdBy: { select: { username: true, displayName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get all users
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      select: { id: true, username: true, displayName: true }
    });

    // Calculate statistics per user
    const userStats = users.map(u => {
      const userTasks = tasks.filter(t => t.ownerId === u.id);
      const completed = userTasks.filter(t => t.status === 'DONE').length;
      const inProgress = userTasks.filter(t => t.status === 'IN_PROGRESS').length;
      const onHold = userTasks.filter(t => t.status === 'ON_HOLD').length;
      const newTasks = userTasks.filter(t => t.status === 'NEW').length;
      const total = userTasks.length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        userId: u.id,
        username: u.username,
        displayName: u.displayName,
        total,
        completed,
        inProgress,
        onHold,
        new: newTasks,
        completionRate
      };
    });

    // Overall statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const onHoldTasks = tasks.filter(t => t.status === 'ON_HOLD').length;
    const newTasks = tasks.filter(t => t.status === 'NEW').length;
    const overallCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Overdue tasks (ON_HOLD for more than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const overdueTasks = tasks.filter(t => 
      t.status === 'ON_HOLD' && new Date(t.updatedAt) < sevenDaysAgo
    );

    // Category breakdown
    const transactionsTasks = tasks.filter(t => t.category === 'TRANSACTIONS').length;
    const hrTasks = tasks.filter(t => t.category === 'HR').length;

    return NextResponse.json({
      userStats,
      overall: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        onHold: onHoldTasks,
        new: newTasks,
        completionRate: overallCompletionRate,
        overdue: overdueTasks.length
      },
      categories: {
        transactions: transactionsTasks,
        hr: hrTasks
      },
      tasks,
      overdueTasks
    });

  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
