import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { promises as fs } from 'fs';
import path from 'path';


// GET /api/hr/requests/[id]/attachments/[fileId] - Download file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id, fileId } = await params;
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const hrRequest = await prisma.hRRequest.findUnique({
      where: { id }
    });

    if (!hrRequest) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    // Check permissions
    const canView = 
      session.user.role === 'ADMIN' ||
      session.user.role === 'HR_EMPLOYEE' ||
      hrRequest.employeeId === session.user.id;

    if (!canView) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const attachments = hrRequest.attachments 
      ? JSON.parse(hrRequest.attachments) 
      : [];

    const file = attachments.find((f: any) => f.id === fileId);
    
    if (!file) {
      return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 });
    }

    const filePath = path.join(
      process.cwd(),
      'uploads',
      'hr-requests',
      id,
      file.filename
    );

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 });
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath);

    // Determine content type
    const ext = path.extname(file.filename).toLowerCase();
    const contentTypeMap: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };

    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    // Return file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحميل الملف' },
      { status: 500 }
    );
  }
}
