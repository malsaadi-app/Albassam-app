import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET /api/hr/employees/[id]/files/[fileId] - تحميل ملف
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const session = await getSession(await cookies());
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id: employeeId, fileId } = await params;

    const document = await prisma.document.findFirst({
      where: {
        id: fileId,
        employeeId
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 });
    }

    const filePath = path.join(process.cwd(), 'public', document.filePath);

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'الملف غير موجود على السيرفر' }, { status: 404 });
    }

    // Return file URL for download
    return NextResponse.json({
      url: document.filePath,
      fileName: document.fileName,
      mimeType: document.mimeType
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحميل الملف' },
      { status: 500 }
    );
  }
}

// DELETE /api/hr/employees/[id]/files/[fileId] - حذف ملف
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const session = await getSession(await cookies());
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Only ADMIN and HR can delete files
    if (!['ADMIN', 'HR_EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'غير مصرح لك بحذف الملفات' }, { status: 403 });
    }

    const { id: employeeId, fileId } = await params;

    const document = await prisma.document.findFirst({
      where: {
        id: fileId,
        employeeId
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 });
    }

    // Delete file from disk
    const filePath = path.join(process.cwd(), 'public', document.filePath);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    // Delete document record
    await prisma.document.delete({
      where: { id: fileId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الملف' },
      { status: 500 }
    );
  }
}
