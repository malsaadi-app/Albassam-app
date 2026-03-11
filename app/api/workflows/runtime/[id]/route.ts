import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';

/**
 * GET /api/workflows/runtime/[id]
 * Get details of a specific workflow approval
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;

    const approval = await prisma.workflowRuntimeApproval.findUnique({
      where: { id },
      include: {
        version: {
          include: {
            workflow: {
              select: {
                id: true,
                name: true,
                description: true,
                module: true
              }
            },
            steps: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                order: true,
                titleAr: true,
                titleEn: true,
                stepType: true
              }
            }
          }
        },
        stepDefinition: {
          select: {
            id: true,
            order: true,
            titleAr: true,
            titleEn: true,
            stepType: true,
            configJson: true,
            requireComment: true,
            allowConsult: true,
            allowDelegation: true
          }
        },
        approver: {
          select: {
            id: true,
            displayName: true,
            username: true
          }
        }
      }
    });

    if (!approval) {
      return NextResponse.json({ error: 'الموافقة غير موجودة' }, { status: 404 });
    }

    // Check authorization - only approver or admin can view
    if (approval.approverId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // Get request details
    let requestDetails: any = null;

    if (approval.requestType === 'HR_REQUEST') {
      requestDetails = await prisma.hRRequest.findUnique({
        where: { id: approval.requestId },
        include: {
          employee: {
            select: {
              id: true,
              displayName: true,
              username: true
            }
          }
        }
      });
    } else if (approval.requestType === 'PURCHASE_REQUEST') {
      requestDetails = await prisma.purchaseRequest.findUnique({
        where: { id: approval.requestId },
        include: {
          requestedBy: {
            select: {
              id: true,
              displayName: true,
              username: true
            }
          }
        }
      });
    } else if (approval.requestType === 'MAINTENANCE_REQUEST') {
      requestDetails = await prisma.maintenanceRequest.findUnique({
        where: { id: approval.requestId },
        include: {
          branch: {
            select: {
              id: true,
              name: true
            }
          },
          stage: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    } else if (approval.requestType === 'ATTENDANCE_CORRECTION') {
      requestDetails = await prisma.attendanceRequest.findUnique({
        where: { id: approval.requestId },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              username: true
            }
          }
        }
      });
    }

    // Get all approvals for this request (history)
    const allApprovals = await prisma.workflowRuntimeApproval.findMany({
      where: {
        requestType: approval.requestType,
        requestId: approval.requestId
      },
      include: {
        stepDefinition: {
          select: {
            order: true,
            titleAr: true
          }
        },
        approver: {
          select: {
            displayName: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({
      approval: {
        id: approval.id,
        requestType: approval.requestType,
        requestId: approval.requestId,
        status: approval.status,
        level: approval.level,
        comments: approval.comments,
        createdAt: approval.createdAt,
        reviewedAt: approval.reviewedAt,
        metadata: approval.metadata ? JSON.parse(approval.metadata as string) : null
      },
      workflow: {
        id: approval.version.workflow.id,
        name: approval.version.workflow.name,
        description: approval.version.workflow.description,
        module: approval.version.workflow.module,
        version: approval.version.version,
        totalSteps: approval.version.steps.length,
        steps: approval.version.steps
      },
      currentStep: {
        ...approval.stepDefinition,
        configJson: undefined // Don't expose raw config to frontend
      },
      approver: approval.approver,
      request: requestDetails,
      history: allApprovals.map(a => ({
        id: a.id,
        status: a.status,
        stepName: a.stepDefinition.titleAr,
        stepOrder: a.stepDefinition.order,
        approverName: a.approver.displayName,
        comments: a.comments,
        createdAt: a.createdAt,
        reviewedAt: a.reviewedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching workflow approval:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب تفاصيل الموافقة' },
      { status: 500 }
    );
  }
}
