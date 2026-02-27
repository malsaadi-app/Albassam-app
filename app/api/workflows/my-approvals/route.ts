import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { WorkflowApprovalStatus } from '@prisma/client';

/**
 * GET /api/workflows/my-approvals
 * Get pending approvals for current user
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Get current user from session
    // For now, return mock data
    const mockApprovals = [
      {
        id: '1',
        requestType: 'HR_REQUEST',
        requestId: 'hr-001',
        requestTitle: 'طلب إجازة - أحمد محمد',
        requesterName: 'أحمد محمد',
        stepName: 'مراجعة المدير المباشر',
        workflowName: 'سير عمل طلبات الإجازات',
        stepOrder: 2,
        totalSteps: 5,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        daysWaiting: 2
      },
      {
        id: '2',
        requestType: 'PURCHASE_REQUEST',
        requestId: 'pr-001',
        requestTitle: 'طلب شراء معدات مكتبية',
        requesterName: 'فاطمة علي',
        stepName: 'مراجعة مدير المشتريات',
        workflowName: 'سير عمل طلبات الشراء',
        stepOrder: 3,
        totalSteps: 7,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        daysWaiting: 4
      },
      {
        id: '3',
        requestType: 'HR_REQUEST',
        requestId: 'hr-002',
        requestTitle: 'طلب تعديل حضور - سارة خالد',
        requesterName: 'سارة خالد',
        stepName: 'مراجعة الموارد البشرية',
        workflowName: 'سير عمل تصحيح الحضور',
        stepOrder: 1,
        totalSteps: 3,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        daysWaiting: 1
      }
    ];

    return NextResponse.json({
      approvals: mockApprovals,
      count: mockApprovals.length
    });

    // Real implementation would be:
    /*
    const userId = 'CURRENT_USER_ID'; // from session

    const approvals = await prisma.workflowApprovalLog.findMany({
      where: {
        approverId: userId,
        status: WorkflowApprovalStatus.PENDING
      },
      include: {
        step: {
          include: {
            workflow: true
          }
        },
        approver: {
          select: {
            id: true,
            displayName: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Format and enrich data...
    const formattedApprovals = approvals.map(a => ({
      id: a.id,
      requestType: a.requestType,
      requestId: a.requestId,
      requestTitle: 'TODO: fetch from request',
      requesterName: 'TODO: fetch from request',
      stepName: a.step.name,
      workflowName: a.step.workflow.name,
      stepOrder: a.step.order,
      totalSteps: // calculate total steps
      createdAt: a.createdAt,
      daysWaiting: Math.floor((Date.now() - a.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    }));

    return NextResponse.json({
      approvals: formattedApprovals,
      count: formattedApprovals.length
    });
    */

  } catch (error: any) {
    console.error('Error fetching my approvals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approvals', details: error?.message },
      { status: 500 }
    );
  }
}
