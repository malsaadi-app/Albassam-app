import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { isAdmin } from '@/lib/authz';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// GET /api/tasks/[id]/attachments - Get task attachments
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
      select: { attachments: true, ownerId: true, isPrivate: true }
    });

    if (!task) {
      return NextResponse.json({ error: 'المهمة غير موجودة' }, { status: 404 });
    }

    // Check permissions
    if (!isAdmin(session.user.role) && task.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });
    }

    const attachments = task.attachments ? JSON.parse(task.attachments) : [];

    return NextResponse.json({ attachments });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// POST /api/tasks/[id]/attachments - Upload attachment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
      select: { attachments: true, ownerId: true }
    });

    if (!task) {
      return NextResponse.json({ error: 'المهمة غير موجودة' }, { status: 404 });
    }

    // Check permissions
    if (!isAdmin(session.user.role) && task.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'لم يتم تحديد ملف' }, { status: 400 });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'حجم الملف كبير جداً (الحد الأقصى 10MB)' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'tasks', id);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${timestamp}-${originalName}`;
    const filepath = join(uploadsDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Update attachments in database
    const currentAttachments = task.attachments ? JSON.parse(task.attachments) : [];
    const newAttachment = {
      id: `${timestamp}`,
      name: file.name,
      filename,
      size: file.size,
      type: file.type,
      url: `/uploads/tasks/${id}/${filename}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: session.user.id
    };

    currentAttachments.push(newAttachment);

    await prisma.task.update({
      where: { id },
      data: { attachments: JSON.stringify(currentAttachments) }
    });

    return NextResponse.json({ 
      message: 'تم رفع الملف بنجاح',
      attachment: newAttachment 
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء رفع الملف' }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]/attachments - Delete attachment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get('attachmentId');

    if (!attachmentId) {
      return NextResponse.json({ error: 'معرف المرفق مطلوب' }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id },
      select: { attachments: true, ownerId: true }
    });

    if (!task) {
      return NextResponse.json({ error: 'المهمة غير موجودة' }, { status: 404 });
    }

    // Check permissions
    if (!isAdmin(session.user.role) && task.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });
    }

    // Remove attachment from list
    const currentAttachments = task.attachments ? JSON.parse(task.attachments) : [];
    const updatedAttachments = currentAttachments.filter((att: any) => att.id !== attachmentId);

    await prisma.task.update({
      where: { id },
      data: { attachments: JSON.stringify(updatedAttachments) }
    });

    return NextResponse.json({ message: 'تم حذف المرفق بنجاح' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف المرفق' }, { status: 500 });
  }
}
