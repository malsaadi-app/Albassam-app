import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { isDelegatedViewer } from '@/lib/delegation';
import { HR_REQUEST_TYPE_CONFIG } from '@/lib/hrRequestConfig';
import { createHRRequestAuditLog } from '@/lib/audit';

// Validation schema for HR requests
const hrRequestSchema = z.object({
  type: z.enum([
    'LEAVE',
    'TICKET_ALLOWANCE',
    'FLIGHT_BOOKING',
    'SALARY_CERTIFICATE',
    'HOUSING_ALLOWANCE',
    'VISA_EXIT_REENTRY_SINGLE',
    'VISA_EXIT_REENTRY_MULTI',
    'RESIGNATION'
  ]),
  // Leave-specific
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  leaveType: z.string().optional(), // annual/sick/emergency
  // Common fields
  destination: z.string().optional(),
  travelDate: z.string().optional(),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),
  amount: z.number().optional(),
  period: z.string().optional(),
  purpose: z.string().optional(),
  recipientOrganization: z.string().optional(),
  reason: z.string().optional(),
  attachment: z.string().optional()
}).superRefine((val, ctx) => {
  const cfg = (HR_REQUEST_TYPE_CONFIG as any)[val.type];
  if (!cfg) return;

  for (const field of cfg.requiredFields || []) {
    const v = (val as any)[field];
    const isMissing = v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (typeof v === 'number' && isNaN(v));
    if (isMissing) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `الحقل مطلوب: ${field}`, path: [field] });
    }
  }
});

// Helper function to create notification
async function createNotification(userId: string, title: string, message: string, type: string, relatedId?: string) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        relatedId,
        isRead: false
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// GET /api/hr/requests - List requests (filtered by role)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build filter based on role
    const where: any = {};

    const delegated = await isDelegatedViewer(prisma, session.user.id);

    if (session.user.role === 'USER' && !delegated) {
      // Regular users see only their own requests
      where.employeeId = session.user.id;
    } else if (session.user.role === 'HR_EMPLOYEE') {
      // HR employees see requests that need review or they've reviewed
      where.OR = [
        { status: 'PENDING_REVIEW' },
        { status: 'RETURNED' },
        { reviewedBy: session.user.id }
      ];
    }
    // ADMIN and delegated viewer see all requests (no additional filter)

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const [requests, total] = await Promise.all([
      prisma.hRRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              displayName: true,
              username: true
            }
          },
          reviewer: {
            select: {
              id: true,
              displayName: true,
              username: true
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
      }),
      prisma.hRRequest.count({ where })
    ]);

    return NextResponse.json({
      requests,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching HR requests:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الطلبات' },
      { status: 500 }
    );
  }
}

// POST /api/hr/requests - Submit new request
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = hrRequestSchema.parse(body);

    // Get workflow for this request type
    const workflow = await prisma.hRRequestTypeWorkflow.findUnique({
      where: { requestType: validatedData.type as any },
      include: {
        steps: {
          orderBy: { order: 'asc' }
        }
      }
    });

    // Determine initial status and workflow step
    let initialWorkflowStep: number | null = null;
    let firstStepName: string | null = null;

    if (workflow && workflow.steps && workflow.steps.length > 0) {
      const firstStep = workflow.steps[0];
      firstStepName = firstStep.statusName; // We'll use this in notification
      initialWorkflowStep = 0;
      // Responsible user is resolved dynamically (branch manager / HR employee / etc)
    }

    // Create the request
    const hrRequest = await prisma.hRRequest.create({
      data: {
        type: validatedData.type,
        employeeId: session.user.id,
        status: 'PENDING_REVIEW',
        currentWorkflowStep: initialWorkflowStep,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        leaveType: validatedData.leaveType,
        destination: validatedData.destination,
        travelDate: validatedData.travelDate ? new Date(validatedData.travelDate) : undefined,
        departureDate: validatedData.departureDate ? new Date(validatedData.departureDate) : undefined,
        returnDate: validatedData.returnDate ? new Date(validatedData.returnDate) : undefined,
        amount: validatedData.amount,
        period: validatedData.period,
        purpose: validatedData.purpose,
        recipientOrganization: validatedData.recipientOrganization,
        reason: validatedData.reason,
        attachments: validatedData.attachment
      },
      include: {
        employee: {
          select: {
            displayName: true
          }
        }
      }
    });

    await createHRRequestAuditLog(prisma, {
      requestId: hrRequest.id,
      actorUserId: session.user.id,
      action: 'REQUEST_CREATED',
      message: 'تم إنشاء الطلب'
    });

    // If it's a leave request, calculate days
    if (validatedData.type === 'LEAVE' && validatedData.startDate && validatedData.endDate) {
      const start = new Date(validatedData.startDate);
      const end = new Date(validatedData.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Note: We don't deduct from balance yet - only after approval
      console.log(`Leave request for ${days} days`);
    }

    // Send notification to the responsible person(s) for first step (dynamic routing)
    const { userIds: firstUserIds, labelAr } = await (await import('@/lib/hrWorkflowRouting')).getApproverUserIdsForHRRequestStep({
      requestType: validatedData.type,
      requesterUserId: session.user.id,
      stepOrder: 0
    });

    const stepDesc = firstStepName ? ` - المرحلة: ${firstStepName}` : labelAr ? ` - المرحلة: ${labelAr}` : '';

    if (firstUserIds.length > 0) {
      for (const userId of firstUserIds) {
        await createNotification(
          userId,
          'طلب جديد بانتظار موافقتك',
          `تم استلام طلب ${getRequestTypeArabic(validatedData.type)} من ${hrRequest.employee.displayName}${stepDesc}`,
          'request_submitted',
          hrRequest.id
        );
      }
    } else {
      // Fallback: notify HR employees if no routing could be resolved
      const hrEmployees = await prisma.user.findMany({
        where: { role: 'HR_EMPLOYEE' },
        select: { id: true }
      });

      for (const hrEmployee of hrEmployees) {
        await createNotification(
          hrEmployee.id,
          'طلب جديد',
          `تم استلام طلب ${getRequestTypeArabic(validatedData.type)} من ${hrRequest.employee.displayName}`,
          'request_submitted',
          hrRequest.id
        );
      }
    }

    return NextResponse.json(hrRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating HR request:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الطلب' },
      { status: 500 }
    );
  }
}

// Helper function to get Arabic request type name
function getRequestTypeArabic(type: string): string {
  const types: { [key: string]: string } = {
    'LEAVE': 'إجازة',
    'TICKET_ALLOWANCE': 'بدل تذاكر',
    'FLIGHT_BOOKING': 'حجز طيران',
    'SALARY_CERTIFICATE': 'تعريف بالراتب',
    'HOUSING_ALLOWANCE': 'بدل سكن',
    'VISA_EXIT_REENTRY_SINGLE': 'خروج/عودة مفرد',
    'VISA_EXIT_REENTRY_MULTI': 'خروج/عودة متعدد',
    'RESIGNATION': 'استقالة'
  };
  return types[type] || type;
}
