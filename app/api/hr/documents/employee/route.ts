import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';
import { getSession } from '@/lib/session';


// GET /api/hr/documents/employee?employeeId=xxx - وثائق موظف
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId مطلوب' }, { status: 400 });
    }

    const documents = await prisma.document.findMany({
      where: { employeeId },
      orderBy: { uploadedAt: 'desc' },
      include: {
        employee: {
          select: {
            fullNameAr: true,
            employeeNumber: true
          }
        }
      }
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    );
  }
}

// POST /api/hr/documents/employee?employeeId=xxx - رفع وثيقة
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId مطلوب' }, { status: 400 });
    }

    const formData = await request.formData();

    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const category = formData.get('category') as string;
    const issueDate = formData.get('issueDate') as string;
    const expiryDate = formData.get('expiryDate') as string;
    const notes = formData.get('notes') as string;

    if (!file || !title || !type) {
      return NextResponse.json(
        { error: 'الملف والعنوان والنوع مطلوبة' },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'uploads', 'hr', employeeId);
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const fileName = `${timestamp}-${originalName}`;
    const filePath = join(uploadDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create document record
    const document = await prisma.document.create({
      data: {
        employeeId,
        title,
        type: type as any,
        category: category || undefined,
        filePath: `/uploads/hr/${employeeId}/${fileName}`,
        fileName: originalName,
        fileSize: file.size,
        mimeType: file.type,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        notes: notes || undefined,
        uploadedBy: session.user.displayName
      }
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء رفع الوثيقة' },
      { status: 500 }
    );
  }
}
