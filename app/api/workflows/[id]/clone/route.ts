import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/workflows/[id]/clone
 * Clone an existing workflow
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch original workflow with all details
    const original = await prisma.workflow.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { order: 'asc' }
        },
        branches: true,
        stages: true
      }
    });

    if (!original) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Create cloned workflow
    const cloned = await prisma.workflow.create({
      data: {
        name: `نسخة من ${original.name}`,
        description: original.description,
        type: original.type,
        forSpecificType: original.forSpecificType,
        isActive: false, // Start as inactive
        branches: {
          create: original.branches.map(wb => ({
            branchId: wb.branchId
          }))
        },
        stages: original.stages && original.stages.length > 0 ? {
          create: original.stages.map(ws => ({
            stageId: ws.stageId
          }))
        } : undefined,
        steps: {
          create: original.steps.map(step => ({
            name: step.name,
            order: step.order,
            level: step.level,
            approverType: step.approverType,
            approverUserId: step.approverUserId,
            workflowRoleId: step.workflowRoleId,
            approverSystemRole: step.approverSystemRole,
            allowReject: step.allowReject,
            autoEscalateDays: step.autoEscalateDays,
            notifyOnEntry: step.notifyOnEntry,
            notifyOnApproval: step.notifyOnApproval,
            notifyOnReject: step.notifyOnReject
          }))
        }
      },
      include: {
        steps: {
          orderBy: { order: 'asc' }
        },
        branches: {
          include: {
            branch: true
          }
        },
        stages: {
          include: {
            stage: true
          }
        }
      }
    });

    return NextResponse.json({
      workflow: cloned,
      message: 'تم نسخ سير العمل بنجاح'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error cloning workflow:', error);
    return NextResponse.json(
      { error: 'Failed to clone workflow', details: error?.message },
      { status: 500 }
    );
  }
}
