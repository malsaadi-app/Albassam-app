import { NextRequest, NextResponse } from 'next/server'
import { saveApprovalDocument } from '@/lib/approvalUploads'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'لم يتم تحديد ملف' }, { status: 400 })
    }

    const saved = await saveApprovalDocument(file)

    return NextResponse.json({
      success: true,
      filename: saved.originalName,
      path: saved.urlPath,
      size: saved.size,
      type: saved.mimeType,
    })
  } catch (error: any) {
    const code = typeof error?.message === 'string' ? error.message : ''

    if (code === 'FILE_TOO_LARGE') {
      return NextResponse.json({ error: 'حجم الملف يتجاوز 10 ميجابايت' }, { status: 400 })
    }

    if (code === 'INVALID_FILE_TYPE') {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم (PDF / JPG / PNG فقط)' }, { status: 400 })
    }

    console.error('Approval upload error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء رفع الملف' }, { status: 500 })
  }
}
