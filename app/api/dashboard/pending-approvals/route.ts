import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';

/**
 * GET /api/dashboard/pending-approvals
 * Returns detailed list of pending approvals for current user
 * Uses NEW workflow system (WorkflowRuntimeApproval)
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get pending approvals with workflow details
    const approvals = await prisma.workflowRuntimeApproval.findMany({
      where: {
        approverId: userId,
        status: 'PENDING'
      },
      include: {
        version: {
          include: {
            workflow: {
              select: {
                id: true,
                name: true,
                module: true
              }
            }
          }
        },
        stepDefinition: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            order: true
          }
        },
        approver: {
          select: {
            id: true,
            displayName: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // Oldest first (FIFO)
      }
    });

    // Enrich with request details
    const enriched = await Promise.all(
      approvals.map(async (approval) => {
        let requestDetails: any = null;

        // Fetch actual request based on type
        try {
          if (approval.requestType === 'HR_REQUEST') {
            requestDetails = await prisma.hRRequest.findUnique({
              where: { id: approval.requestId },
              select: {
                id: true,
                type: true,
                status: true,
                createdAt: true,
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
              select: {
                id: true,
                requestNumber: true,
                category: true,
                status: true,
                estimatedBudget: true,
                createdAt: true,
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
              select: {
                id: true,
                requestNumber: true,
                type: true,
                category: true,
                priority: true,
                status: true,
                createdAt: true,
                requestedBy: {
                  select: {
                    id: true,
                    fullNameAr: true,
                    employeeNumber: true
                  }
                }
              }
            });
          } else if (approval.requestType === 'ATTENDANCE_CORRECTION') {
            requestDetails = await prisma.attendanceRequest.findUnique({
              where: { id: approval.requestId },
              select: {
                id: true,
                type: true,
                requestDate: true,
                status: true,
                createdAt: true,
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
        } catch (error) {
          console.error(`Error fetching request ${approval.requestId}:`, error);
        }

        return {
          id: approval.id,
          requestType: approval.requestType,
          requestId: approval.requestId,
          workflowName: approval.version.workflow.name,
          workflowModule: approval.version.workflow.module,
          stepName: approval.stepDefinition.titleAr,
          stepOrder: approval.stepDefinition.order,
          status: approval.status,
          level: approval.level,
          createdAt: approval.createdAt,
          request: requestDetails,
          metadata: approval.metadata ? JSON.parse(approval.metadata as string) : null
        };
      })
    );

    return NextResponse.json({
      approvals: enriched,
      total: enriched.length
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
