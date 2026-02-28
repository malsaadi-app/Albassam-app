import prisma from '@/lib/prisma'
import type { NormalizedPrintDoc, NormalizedTimelineItem } from '@/lib/print/normalize'

export async function getSupplierRequestPrintDoc(id: string, locale: 'ar' | 'en'): Promise<NormalizedPrintDoc | null> {
  const req = await prisma.supplierRequest.findUnique({
    where: { id },
    include: {
      requestedBy: true,
      approvedBy: true,
      rejectedBy: true,
      createdSupplier: true
    }
  })

  if (!req) return null

  const metaRows = [
    { label: locale === 'ar' ? 'اسم المورد' : 'Supplier name', value: req.name },
    { label: locale === 'ar' ? 'جهة الاتصال' : 'Contact', value: req.contactPerson ?? '-' },
    { label: locale === 'ar' ? 'البريد' : 'Email', value: req.email ?? '-' },
    { label: locale === 'ar' ? 'الجوال' : 'Phone', value: req.phone ?? '-' },
    { label: locale === 'ar' ? 'التصنيف' : 'Category', value: req.category ?? '-' },
    { label: locale === 'ar' ? 'الرقم الضريبي' : 'Tax number', value: req.taxNumber ?? '-' }
  ]

  const timeline: NormalizedTimelineItem[] = []

  timeline.push({
    stepName: locale === 'ar' ? 'إنشاء الطلب' : 'Submitted',
    actorName: req.requestedBy.displayName,
    actorTitle: locale === 'ar' ? 'موظف مشتريات' : 'Procurement officer',
    status: 'INFO',
    at: req.createdAt,
    comment: req.notes ?? ''
  })

  if (req.status === 'PENDING') {
    timeline.push({
      stepName: locale === 'ar' ? 'اعتماد' : 'Approval',
      actorName: locale === 'ar' ? 'مدير الخدمات المساندة' : 'Support services manager',
      actorTitle: locale === 'ar' ? 'اعتماد' : 'Approval',
      status: 'PENDING'
    })
  }

  if (req.status === 'APPROVED') {
    timeline.push({
      stepName: locale === 'ar' ? 'اعتماد' : 'Approved',
      actorName: req.approvedBy?.displayName ?? '',
      actorTitle: locale === 'ar' ? 'مدير الخدمات المساندة' : 'Support services manager',
      status: 'APPROVED',
      at: req.approvedAt ?? undefined
    })
  }

  if (req.status === 'REJECTED') {
    timeline.push({
      stepName: locale === 'ar' ? 'رفض' : 'Rejected',
      actorName: req.rejectedBy?.displayName ?? '',
      actorTitle: locale === 'ar' ? 'مدير الخدمات المساندة' : 'Support services manager',
      status: 'REJECTED',
      at: req.rejectedAt ?? undefined,
      comment: req.rejectionReason ?? ''
    })
  }

  return {
    title: locale === 'ar' ? 'طلب إضافة مورد' : 'Supplier Onboarding Request',
    number: req.id,
    createdAt: req.createdAt,
    currentStepLabel: req.status === 'PENDING' ? (locale === 'ar' ? 'بانتظار الاعتماد' : 'Pending approval') : req.status,
    statusLabel: req.status,
    metaRows,
    timeline
  }
}
