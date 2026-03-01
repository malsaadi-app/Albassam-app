import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { PurchaseCategory, PurchasePriority, PurchaseRequestStatus } from '@prisma/client';

// GET /api/procurement/requests - Get all purchase requests
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const department = searchParams.get('department');

    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status as PurchaseRequestStatus;
    }
    
    if (category) {
      where.category = category as PurchaseCategory;
    }
    
    if (department) {
      where.department = department;
    }

    // Non-admin users only see their own requests
    if (session.user.role !== 'ADMIN') {
      where.requestedById = session.user.id;
    }

    const requests = await prisma.purchaseRequest.findMany({
      where,
      include: {
        requestedBy: {
          select: {
            id: true,
            displayName: true,
            username: true
          }
        },
        reviewedBy: {
          select: {
            id: true,
            displayName: true,
            username: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            displayName: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Parse JSON fields
    const requestsWithParsedFields = requests.map(req => ({
      ...req,
      items: JSON.parse(req.items),
      attachments: req.attachments ? JSON.parse(req.attachments) : []
    }));

    return NextResponse.json({ 
      requests: requestsWithParsedFields 
    });
  } catch (error) {
    console.error('Error fetching purchase requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase requests' },
      { status: 500 }
    );
  }
}

// POST /api/procurement/requests - Create new purchase request
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      department,
      category,
      items,
      priority = 'NORMAL',
      justification,
      attachments = [],
      estimatedBudget,
      requiredDate
    } = body;

    // Validation
    if (!department || !category || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate request number (e.g., PR-2026-0001)
    // Use count-based generation to avoid parsing issues from legacy/bad requestNumber values.
    const year = new Date().getFullYear();
    const existingCount = await prisma.purchaseRequest.count({
      where: {
        requestNumber: {
          startsWith: `PR-${year}-`,
        },
      },
    });
    const nextNumber = existingCount + 1;
    const requestNumber = `PR-${year}-${String(nextNumber).padStart(4, '0')}`;

    // Get workflow for this category
    const workflow = await prisma.procurementCategoryWorkflow.findUnique({
      where: { category: category as PurchaseCategory },
      include: {
        steps: {
          orderBy: { order: 'asc' }
        }
      }
    });

    // Determine initial workflow step
    let initialWorkflowStep: number | null = null;
    let firstResponsibleUserIds: string[] = [];
    let firstStepName: string | null = null;

    if (workflow && workflow.steps && workflow.steps.length > 0) {
      const firstStep = workflow.steps[0];
      firstStepName = firstStep.statusName;
      initialWorkflowStep = 0;
      // Step0 may be dynamic (gatekeeper) based on requester branch coverage
      const { resolveProcurementStepAssignees } = await import('@/lib/procurementWorkflowRouting');
      firstResponsibleUserIds = await resolveProcurementStepAssignees({
        requestedByUserId: session.user.id,
        workflowCategory: category,
        stepIndex: 0,
        fallbackUserId: firstStep.userId,
      });
    }

    // Create purchase request
    const purchaseRequest = await prisma.purchaseRequest.create({
      data: {
        requestNumber,
        requestedById: session.user.id,
        department,
        category: category as PurchaseCategory,
        items: JSON.stringify(items),
        priority: priority as PurchasePriority,
        justification,
        attachments: attachments.length > 0 ? JSON.stringify(attachments) : null,
        estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : null,
        requiredDate: requiredDate ? new Date(requiredDate) : null,
        status: 'PENDING_REVIEW',
        currentWorkflowStep: initialWorkflowStep
      },
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

    // Send notification to the responsible person(s) for first step
    if (firstResponsibleUserIds.length > 0) {
      const stepDesc = firstStepName ? ` - المرحلة: ${firstStepName}` : '';
      for (const userId of firstResponsibleUserIds) {
        await prisma.notification.create({
          data: {
            userId,
            title: 'طلب شراء جديد بانتظار موافقتك',
            message: `طلب شراء ${requestNumber} من ${session.user.displayName} - القسم: ${department}${stepDesc}`,
            type: 'PURCHASE_REQUEST',
            relatedId: purchaseRequest.id,
            isRead: false
          }
        });
      }
    } else {
      // Fallback: notify admins if no workflow configured
      const admins = await prisma.user.findMany({
        where: {
          role: 'ADMIN'
        }
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: 'طلب شراء جديد',
            message: `طلب شراء جديد ${requestNumber} من ${session.user.displayName} - القسم: ${department}`,
            type: 'PURCHASE_REQUEST',
            relatedId: purchaseRequest.id,
            isRead: false
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      request: {
        ...purchaseRequest,
        items: JSON.parse(purchaseRequest.items),
        attachments: purchaseRequest.attachments ? JSON.parse(purchaseRequest.attachments) : []
      }
    });
  } catch (error) {
    console.error('Error creating purchase request:', error);

    // Helpful diagnostics for QA users
    try {
      const session = await getSession(await cookies());
      const isQaUser = !!session?.user?.username && session.user.username.startsWith('qa_');
      if (isQaUser) {
        return NextResponse.json(
          { error: 'Failed to create purchase request', details: String((error as any)?.message || error) },
          { status: 500 }
        );
      }
    } catch {
      // ignore
    }

    return NextResponse.json(
      { error: 'Failed to create purchase request' },
      { status: 500 }
    );
  }
}
