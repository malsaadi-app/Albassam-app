import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';


// DELETE /api/tasks/[id]/delete - حذف مهمة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;

    // Check if task exists and user has permission
    const task = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        createdById: true,
        ownerId: true
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'المهمة غير موجودة' }, { status: 404 });
    }

    // Only allow creator, owner, or admin to delete
    const isAdmin = session.user.role === 'ADMIN';
    const isCreator = task.createdById === session.user.id;
    const isOwner = task.ownerId === session.user.id;

    if (!isAdmin && !isCreator && !isOwner) {
      return NextResponse.json({ error: 'غير مصرح لك بحذف هذه المهمة' }, { status: 403 });
    }

    // Delete task (cascade will delete related records)
    await prisma.task.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true,
      message: 'تم حذف المهمة بنجاح'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف المهمة' },
      { status: 500 }
    );
  }
}
