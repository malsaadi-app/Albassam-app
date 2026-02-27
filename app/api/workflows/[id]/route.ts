import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/workflows/[id]
 * Get single workflow with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const workflow = await prisma.workflow.findUnique({
      where: { id },
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
        },
        stages: {
          include: {
            stage: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ workflow });
  } catch (error: any) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow', details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflows/[id]
 * Delete a workflow
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if workflow exists
    const workflow = await prisma.workflow.findUnique({
      where: { id }
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Delete workflow (cascades will handle steps, branches, stages)
    await prisma.workflow.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'تم حذف سير العمل بنجاح'
    });
  } catch (error: any) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow', details: error?.message },
      { status: 500 }
    );
  }
}
