import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (type) where.type = type;
    if (isActive) where.isActive = isActive === 'true';

    const workflows = await prisma.workflow.findMany({
      where,
      include: {
        steps: {
          include: {
            workflowRole: true,
            approverUser: {
              select: {
                id: true,
                displayName: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        branches: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ 
      workflows,
      count: workflows.length
    });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, type, forSpecificType, isActive, branches: branchIds, stages: stageIds, steps } = body;

    // Validation
    if (!name || !description || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!branchIds || branchIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one branch must be selected' },
        { status: 400 }
      );
    }

    if (!steps || steps.length === 0) {
      return NextResponse.json(
        { error: 'At least one step must be defined' },
        { status: 400 }
      );
    }

    // Validate steps
    for (const step of steps) {
      if (!step.name) {
        return NextResponse.json(
          { error: 'All steps must have a name' },
          { status: 400 }
        );
      }

      if (step.approverType === 'SPECIFIC_USER' && !step.approverUserId) {
        return NextResponse.json(
          { error: `Step "${step.name}" requires a specific user` },
          { status: 400 }
        );
      }

      if (step.approverType === 'ROLE' && !step.approverRoleId) {
        return NextResponse.json(
          { error: `Step "${step.name}" requires a workflow role` },
          { status: 400 }
        );
      }

      if (step.approverType === 'SYSTEM_ROLE' && !step.approverSystemRole) {
        return NextResponse.json(
          { error: `Step "${step.name}" requires a system role` },
          { status: 400 }
        );
      }
    }

    // Create workflow with steps and branches
    const workflow = await prisma.workflow.create({
      data: {
        name,
        description,
        type,
        forSpecificType: forSpecificType || null,
        isActive: isActive ?? true,
        branches: {
          create: branchIds.map((branchId: string) => ({
            branchId
          }))
        },
        stages: stageIds && stageIds.length > 0 ? {
          create: stageIds.map((stageId: string) => ({
            stageId
          }))
        } : undefined,
        steps: {
          create: steps.map((step: any, index: number) => ({
            name: step.name,
            order: index + 1,
            level: 'DEPARTMENT', // Default, can be enhanced
            approverType: step.approverType,
            approverUserId: step.approverUserId || null,
            workflowRoleId: step.approverRoleId || null,
            approverSystemRole: step.approverSystemRole || null,
            allowReject: step.allowReject ?? true,
            autoEscalateDays: step.autoEscalateDays || null,
            notifyOnEntry: step.notifyOnEntry ?? true,
            notifyOnApproval: step.notifyOnApproval ?? true,
            notifyOnReject: step.notifyOnReject ?? true
          }))
        }
      },
      include: {
        steps: {
          include: {
            workflowRole: true,
            approverUser: {
              select: {
                id: true,
                displayName: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        branches: {
          include: {
            branch: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(
      { 
        workflow,
        message: 'Workflow created successfully'
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
