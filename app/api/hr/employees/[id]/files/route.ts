import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET /api/hr/employees/[id]/files - جلب ملفات موظف
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id: employeeId } = await params;

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 });
    }

    // Get all files for this employee
    const files = await prisma.document.findMany({
      where: { employeeId },
      orderBy: { uploadedAt: 'desc' }
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error fetching employee files:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الملفات' },
      { status: 500 }
    );
  }
}

// POST /api/hr/employees/[id]/files - رفع ملف/ملفات
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id: employeeId } = await params;

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const categoriesJson = formData.get('categories') as string;
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'لم يتم رفع أي ملفات' }, { status: 400 });
    }

    let categories: string[] = [];
    try {
      categories = JSON.parse(categoriesJson);
    } catch {
      return NextResponse.json({ error: 'بيانات التصنيفات غير صحيحة' }, { status: 400 });
    }

    if (categories.length !== files.length) {
      return NextResponse.json({ error: 'عدد التصنيفات لا يطابق عدد الملفات' }, { status: 400 });
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'employees', employeeId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uploadedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const category = categories[i];

      // Validate category
      const validCategories = ['ID_CARD', 'CV', 'DEGREE', 'OTHER'];
      if (!validCategories.includes(category)) {
        return NextResponse.json({ error: `تصنيف غير صحيح: ${category}` }, { status: 400 });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${timestamp}_${sanitizedName}`;
      const filePath = `/uploads/employees/${employeeId}/${fileName}`;
      const fullPath = path.join(uploadDir, fileName);

      // Get file buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Write file to disk
      await writeFile(fullPath, buffer);

      // Create document record
      const document = await prisma.document.create({
        data: {
          employeeId,
          title: file.name,
          type: getCategoryType(category) as any,
          category,
          filePath,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          uploadedBy: session.user.username
        }
      });

      uploadedFiles.push(document);
    }

    return NextResponse.json({ files: uploadedFiles }, { status: 201 });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء رفع الملفات' },
      { status: 500 }
    );
  }
}

// Helper function to map category to DocumentType
function getCategoryType(category: string) {
  const mapping: Record<string, any> = {
    'ID_CARD': 'ID',
    'CV': 'OTHER',
    'DEGREE': 'CERTIFICATE',
    'OTHER': 'OTHER'
  };
  return mapping[category] || 'OTHER';
}
