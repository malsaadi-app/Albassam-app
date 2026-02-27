import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { promises as fs } from 'fs';
import path from 'path';
import { isDelegatedViewer } from '@/lib/delegation';
import { createHRRequestAuditLog } from '@/lib/audit';


// File upload configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx', '.xls', '.xlsx'];

// Helper function to sanitize filename
function sanitizeFilename(filename: string): string {
  // Remove special characters and spaces
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 200); // Limit filename length
}

// Helper interface for files with buffer
interface FileWithBuffer {
  size: number;
  originalFilename: string | null;
  mimetype: string | null;
  buffer: Buffer;
}

// Helper function to convert NextRequest to file list with buffers
async function convertToNodeRequest(request: NextRequest): Promise<FileWithBuffer[]> {
  const formData = await request.formData();
  const files: FileWithBuffer[] = [];
  
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      const buffer = Buffer.from(await value.arrayBuffer());
      files.push({
        size: value.size,
        originalFilename: value.name,
        mimetype: value.type,
        buffer
      });
    }
  }
  
  return files;
}

// POST /api/hr/requests/[id]/attachments - Upload files
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Check if request exists and user has permission
    const hrRequest = await prisma.hRRequest.findUnique({
      where: { id }
    });

    if (!hrRequest) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    // Only the employee who submitted can upload files
    if (hrRequest.employeeId !== session.user.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // Parse files from request
    const files = await convertToNodeRequest(request);
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'لا توجد ملفات' }, { status: 400 });
    }

    // Validate files
    const uploadedFiles: any[] = [];
    const uploadDir = path.join(process.cwd(), 'uploads', 'hr-requests', id);
    
    // Create directory if it doesn't exist
    await fs.mkdir(uploadDir, { recursive: true });

    for (const file of files) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `الملف ${file.originalFilename} كبير جداً. الحد الأقصى 10 ميجا` },
          { status: 400 }
        );
      }

      // Validate file type
      const ext = path.extname(file.originalFilename || '').toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { error: `نوع الملف ${ext} غير مسموح به` },
          { status: 400 }
        );
      }

      if (file.mimetype && !ALLOWED_TYPES.includes(file.mimetype)) {
        return NextResponse.json(
          { error: `نوع الملف ${file.mimetype} غير مسموح به` },
          { status: 400 }
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const sanitizedName = sanitizeFilename(file.originalFilename || 'file');
      const uniqueFilename = `${timestamp}_${randomStr}_${sanitizedName}`;
      const filePath = path.join(uploadDir, uniqueFilename);

      // Save file
      await fs.writeFile(filePath, file.buffer);

      // Add to uploaded files list
      uploadedFiles.push({
        id: `${timestamp}_${randomStr}`,
        filename: uniqueFilename,
        originalName: file.originalFilename,
        size: file.size,
        type: file.mimetype,
        uploadedAt: new Date().toISOString()
      });
    }

    // Get existing attachments
    const existingAttachments = hrRequest.attachments 
      ? JSON.parse(hrRequest.attachments) 
      : [];

    // Combine with new uploads
    const allAttachments = [...existingAttachments, ...uploadedFiles];

    // Update database
    await prisma.hRRequest.update({
      where: { id },
      data: {
        attachments: JSON.stringify(allAttachments)
      }
    });

    await createHRRequestAuditLog(prisma, {
      requestId: id,
      actorUserId: session.user.id,
      action: 'ATTACHMENT_UPLOADED',
      message: `تم رفع ${uploadedFiles.length} ملف`,
      diffJson: { uploaded: uploadedFiles }
    });

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `تم رفع ${uploadedFiles.length} ملف بنجاح`
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء رفع الملفات' },
      { status: 500 }
    );
  }
}

// GET /api/hr/requests/[id]/attachments - List files
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const delegated = await isDelegatedViewer(prisma, session.user.id);

    // Check permissions
    const canView = 
      session.user.role === 'ADMIN' ||
      session.user.role === 'HR_EMPLOYEE' ||
      delegated ||
      hrRequest.employeeId === session.user.id;

    if (!canView) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const attachments = hrRequest.attachments 
      ? JSON.parse(hrRequest.attachments) 
      : [];

    return NextResponse.json({ attachments });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المرفقات' },
      { status: 500 }
    );
  }
}

// DELETE /api/hr/requests/[id]/attachments?fileId=xxx - Delete a file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'معرف الملف مطلوب' }, { status: 400 });
    }

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

    // Only the employee who submitted can delete files
    if (hrRequest.employeeId !== session.user.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const attachments = hrRequest.attachments 
      ? JSON.parse(hrRequest.attachments) 
      : [];

    const fileToDelete = attachments.find((f: any) => f.id === fileId);
    
    if (!fileToDelete) {
      return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 });
    }

    // Delete file from filesystem
    const filePath = path.join(
      process.cwd(),
      'uploads',
      'hr-requests',
      id,
      fileToDelete.filename
    );

    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.error('Error deleting file:', err);
    }

    // Update database
    const updatedAttachments = attachments.filter((f: any) => f.id !== fileId);
    
    await prisma.hRRequest.update({
      where: { id },
      data: {
        attachments: JSON.stringify(updatedAttachments)
      }
    });

    await createHRRequestAuditLog(prisma, {
      requestId: id,
      actorUserId: session.user.id,
      action: 'ATTACHMENT_DELETED',
      message: 'تم حذف مرفق',
      diffJson: { deleted: fileToDelete }
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف الملف بنجاح'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الملف' },
      { status: 500 }
    );
  }
}
