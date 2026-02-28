import prisma from '@/lib/prisma'
import type { NormalizedPrintDoc, NormalizedTimelineItem } from '@/lib/print/normalize'
import { getBranchForwarderUserId, getMaintenanceManagerUserId } from '@/lib/maintenance/routing'

function nameForEmployee(e: any, locale: 'ar' | 'en') {
  return locale === 'ar' ? (e?.fullNameAr ?? '') : (e?.fullNameEn ?? e?.fullNameAr ?? '')
}

function titleForEmployee(e: any) {
  // Best-effort until employee list is imported and job titles are normalized.
  return e?.position ?? e?.department ?? ''
}

export async function getMaintenancePrintDoc(id: string, locale: 'ar' | 'en', viewerUserId: string): Promise<NormalizedPrintDoc | null> {
  const req = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: {
      branch: true,
      stage: true,
      requestedBy: true,
      assignedTo: true,
      history: { include: { user: true }, orderBy: { createdAt: 'asc' } }
    }
  })

  if (!req) return null

  const statusLabel = req.status
  const isRequester = req.requestedBy?.userId ? req.requestedBy.userId === viewerUserId : false

  // Determine where it is stopped.
  let currentStepLabel = locale === 'ar' ? 'غير محدد' : 'Unknown'
  if (req.status === 'SUBMITTED') {
    currentStepLabel = locale === 'ar' ? 'عند تدقيق الفرع' : 'Branch review'
  } else if (req.status === 'UNDER_REVIEW') {
    currentStepLabel = locale === 'ar' ? 'عند مدير الصيانة' : 'Maintenance manager'
  } else if (req.status === 'ASSIGNED' || req.status === 'IN_PROGRESS') {
    currentStepLabel = locale === 'ar' ? 'عند الفني' : 'Technician'
  } else if (req.status === 'COMPLETED' || req.status === 'COMPLETED_PENDING_CONFIRMATION') {
    currentStepLabel = locale === 'ar' ? 'مكتمل' : 'Completed'
  } else if (req.status === 'REJECTED') {
    currentStepLabel = locale === 'ar' ? 'مرفوض' : 'Rejected'
  }

  const metaRows = [
    { label: locale === 'ar' ? 'الفرع' : 'Branch', value: req.branch?.name ?? '' },
    { label: locale === 'ar' ? 'المرحلة' : 'Stage', value: req.stage?.name ?? '-' },
    { label: locale === 'ar' ? 'الموقع' : 'Location', value: req.locationDetails ?? '' },
    { label: locale === 'ar' ? 'النوع' : 'Type', value: String(req.type) },
    { label: locale === 'ar' ? 'الأولوية' : 'Priority', value: String(req.priority) },
    { label: locale === 'ar' ? 'مقدم الطلب' : 'Requested by', value: nameForEmployee(req.requestedBy, locale) }
  ]

  const timeline: NormalizedTimelineItem[] = []

  timeline.push({
    stepName: locale === 'ar' ? 'إنشاء الطلب' : 'Created',
    actorName: nameForEmployee(req.requestedBy, locale),
    actorTitle: titleForEmployee(req.requestedBy),
    status: 'INFO',
    at: req.createdAt,
    comment: req.description
  })

  // Try to include the branch forwarder actor in timeline.
  const forwarderUserId = await getBranchForwarderUserId(req.branchId)
  const managerUserId = await getMaintenanceManagerUserId()

  if (forwarderUserId) {
    const forwarder = await prisma.user.findUnique({ where: { id: forwarderUserId } })
    timeline.push({
      stepName: locale === 'ar' ? 'تدقيق الفرع' : 'Branch review',
      actorName: forwarder?.displayName ?? '',
      actorTitle: locale === 'ar' ? 'مسؤول الفرع (خدمات مساندة)' : 'Branch forwarder',
      status: req.status === 'SUBMITTED' ? 'PENDING' : 'APPROVED',
      at: req.status === 'SUBMITTED' ? undefined : req.updatedAt
    })
  }

  if (managerUserId) {
    const mgr = await prisma.user.findUnique({ where: { id: managerUserId } })
    timeline.push({
      stepName: locale === 'ar' ? 'مراجعة مدير الصيانة' : 'Maintenance manager review',
      actorName: mgr?.displayName ?? '',
      actorTitle: locale === 'ar' ? 'مدير الصيانة' : 'Maintenance manager',
      status: req.status === 'UNDER_REVIEW' ? 'PENDING' : req.status === 'SUBMITTED' ? 'PENDING' : 'INFO',
      at: req.status === 'UNDER_REVIEW' ? undefined : undefined
    })
  }

  // Add any status change notes from history
  for (const h of req.history || []) {
    if (h.action === 'STATUS_CHANGED') {
      const isRejection = h.newValue === 'REJECTED'
      const comment = isRequester && !isRejection ? '' : (h.notes ?? '')

      timeline.push({
        stepName: locale === 'ar' ? 'تغيير حالة' : 'Status changed',
        actorName: nameForEmployee(h.user, locale),
        actorTitle: titleForEmployee(h.user),
        status: isRejection ? 'REJECTED' : 'INFO',
        at: h.createdAt,
        comment
      })
    }
  }

  return {
    title: locale === 'ar' ? 'طلب صيانة' : 'Maintenance Request',
    number: req.requestNumber,
    createdAt: req.createdAt,
    currentStepLabel,
    statusLabel,
    metaRows,
    timeline
  }
}
