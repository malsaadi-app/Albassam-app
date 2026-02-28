import prisma from '@/lib/prisma'
import type { NormalizedPrintDoc, NormalizedTimelineItem } from '@/lib/print/normalize'

export async function getProcurementRequestPrintDoc(id: string, locale: 'ar' | 'en', viewerUserId: string): Promise<NormalizedPrintDoc | null> {
  const req = await prisma.purchaseRequest.findUnique({
    where: { id },
    include: {
      requestedBy: true,
      reviewedBy: true,
      approvedBy: true
    }
  })

  if (!req) return null

  const isRequester = req.requestedById === viewerUserId

  const metaRows = [
    { label: locale === 'ar' ? 'رقم الطلب' : 'Request No', value: req.requestNumber },
    { label: locale === 'ar' ? 'القسم' : 'Department', value: req.department },
    { label: locale === 'ar' ? 'الفئة' : 'Category', value: req.category },
    { label: locale === 'ar' ? 'الأولوية' : 'Priority', value: req.priority },
    { label: locale === 'ar' ? 'مقدم الطلب' : 'Requested by', value: req.requestedBy.displayName }
  ]

  const timeline: NormalizedTimelineItem[] = []

  timeline.push({
    stepName: locale === 'ar' ? 'تقديم الطلب' : 'Submitted',
    actorName: req.requestedBy.displayName,
    actorTitle: locale === 'ar' ? 'مقدم الطلب' : 'Requester',
    status: 'INFO',
    at: req.createdAt,
    comment: req.justification ?? ''
  })

  if (req.status === 'PENDING_REVIEW') {
    timeline.push({
      stepName: locale === 'ar' ? 'مراجعة' : 'Review',
      actorName: locale === 'ar' ? 'المراجع' : 'Reviewer',
      actorTitle: locale === 'ar' ? 'مراجع مشتريات' : 'Procurement reviewer',
      status: 'PENDING'
    })
  }

  if (req.reviewedAt) {
    timeline.push({
      stepName: locale === 'ar' ? 'مراجعة' : 'Reviewed',
      actorName: req.reviewedBy?.displayName ?? '-',
      actorTitle: locale === 'ar' ? 'مراجع مشتريات' : 'Procurement reviewer',
      status: 'APPROVED',
      at: req.reviewedAt,
      comment: isRequester ? '' : (req.reviewNotes ?? '')
    })
  }

  if (req.approvedAt) {
    timeline.push({
      stepName: locale === 'ar' ? 'اعتماد' : 'Approved',
      actorName: req.approvedBy?.displayName ?? '-',
      actorTitle: locale === 'ar' ? 'مدير/معتمد' : 'Approver',
      status: 'APPROVED',
      at: req.approvedAt,
      comment: isRequester ? '' : (req.approvalNotes ?? '')
    })
  }

  if (req.status === 'REJECTED') {
    timeline.push({
      stepName: locale === 'ar' ? 'رفض' : 'Rejected',
      actorName: req.approvedBy?.displayName ?? req.reviewedBy?.displayName ?? '-',
      actorTitle: locale === 'ar' ? 'اعتماد' : 'Approval',
      status: 'REJECTED',
      at: req.updatedAt,
      comment: req.rejectedReason ?? ''
    })
  }

  let currentStepLabel: string = req.status
  if (req.status === 'PENDING_REVIEW') currentStepLabel = locale === 'ar' ? 'عند المراجعة' : 'In review'
  if (req.status === 'REVIEWED') currentStepLabel = locale === 'ar' ? 'بانتظار الاعتماد' : 'Pending approval'

  return {
    title: locale === 'ar' ? 'طلب شراء' : 'Purchase Request',
    number: req.requestNumber,
    createdAt: req.createdAt,
    currentStepLabel,
    statusLabel: req.status,
    metaRows,
    timeline
  }
}
