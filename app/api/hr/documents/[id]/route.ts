import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { getSession } from '@/lib/session';


// DELETE /api/hr/documents/[id] - حذف وثيقة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());

    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return NextResponse.json({ error: 'الوثيقة غير موجودة' }, { status: 404 });
    }

    // Delete file from filesystem
    try {
      const fullPath = join(process.cwd(), document.filePath);
      await unlink(fullPath);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Continue even if file deletion fails
    }

    // Delete document record
    await prisma.document.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'تم حذف الوثيقة بنجاح' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الوثيقة' },
      { status: 500 }
    );
  }
}
