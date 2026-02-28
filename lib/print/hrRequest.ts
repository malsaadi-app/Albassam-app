import prisma from '@/lib/prisma'
import type { NormalizedPrintDoc, NormalizedTimelineItem } from '@/lib/print/normalize'

function employeeName(e: any) {
  // HRRequest.employee is User; try displayName first.
  return e?.displayName ?? ''
}

function actorTitle(user: any, locale: 'ar' | 'en') {
  // Best-effort: systemRole name (if exists) else role.
  const sr = user?.systemRole
  if (sr) {
    return locale === 'ar' ? (sr.nameAr ?? sr.nameEn ?? '') : (sr.nameEn ?? sr.nameAr ?? '')
  }
  return user?.role ?? ''
}

export async function getHRRequestPrintDoc(id: string, locale: 'ar' | 'en', viewerUserId: string): Promise<NormalizedPrintDoc | null> {
  const hrRequest = await prisma.hRRequest.findUnique({
    where: { id },
    include: {
      employee: true,
      reviewer: true,
      approver: true
    }
  })

  if (!hrRequest) return null

  const isRequester = hrRequest.employeeId === viewerUserId

  const workflow = await prisma.hRRequestTypeWorkflow.findUnique({
    where: { requestType: hrRequest.type as any },
    include: { steps: { orderBy: { order: 'asc' } } }
  })

  const audit = await prisma.hRRequestAuditLog.findMany({
    where: { requestId: id },
    include: { actor: { include: { systemRole: true } } },
    orderBy: { createdAt: 'asc' }
  })

  // Determine current step label
  let currentStepLabel: string = String(hrRequest.status)
  if (workflow?.steps?.length) {
    const idx = hrRequest.currentWorkflowStep ?? 0
    const step = workflow.steps[idx]
    if (step) {
      currentStepLabel = locale === 'ar' ? step.statusName : step.statusName
    } else {
      currentStepLabel = locale === 'ar' ? 'مكتمل' : 'Completed'
    }
  }

  // Meta fields (minimal but useful)
  const metaRows: Array<{ label: string; value: string }> = [
    { label: locale === 'ar' ? 'النوع' : 'Type', value: String(hrRequest.type) },
    { label: locale === 'ar' ? 'الموظف' : 'Employee', value: employeeName(hrRequest.employee) },
    { label: locale === 'ar' ? 'الحالة' : 'Status', value: String(hrRequest.status) }
  ]

  // Add common date fields if present
  if (hrRequest.startDate) metaRows.push({ label: locale === 'ar' ? 'من' : 'Start', value: new Date(hrRequest.startDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US') })
  if (hrRequest.endDate) metaRows.push({ label: locale === 'ar' ? 'إلى' : 'End', value: new Date(hrRequest.endDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US') })

  const timeline: NormalizedTimelineItem[] = []

  timeline.push({
    stepName: locale === 'ar' ? 'تقديم الطلب' : 'Submitted',
    actorName: hrRequest.employee?.displayName ?? '-',
    actorTitle: actorTitle(hrRequest.employee, locale),
    status: 'INFO',
    at: hrRequest.createdAt,
    comment: hrRequest.reason ?? hrRequest.purpose ?? ''
  })

  // Use audit log as source for steps/comments
  for (const a of audit) {
    const action = String(a.action)
    const isRejection = action === 'REJECTED' || hrRequest.status === 'REJECTED'

    // Hide comments for requester except rejection reason
    const comment = isRequester && !isRejection ? '' : (a.message ?? '')

    let status: NormalizedTimelineItem['status'] = 'INFO'
    if (action === 'REJECTED' || action === 'ADMIN_REJECTED') status = 'REJECTED'
    if (action === 'APPROVED' || action === 'ADMIN_APPROVED') status = 'APPROVED'
    if (action === 'STEP_APPROVED') status = 'APPROVED'

    timeline.push({
      stepName: locale === 'ar' ? 'إجراء' : 'Action',
      actorName: a.actor?.displayName ?? '-',
      actorTitle: actorTitle(a.actor, locale),
      status,
      at: a.createdAt,
      comment
    })
  }

  // Ensure rejection reason is visible to requester
  if (hrRequest.status === 'REJECTED') {
    const reason = hrRequest.reviewComment || hrRequest.approvalComment || ''
    if (reason) {
      timeline.push({
        stepName: locale === 'ar' ? 'سبب الرفض' : 'Rejection reason',
        actorName: hrRequest.reviewer?.displayName ?? hrRequest.approver?.displayName ?? '-',
        actorTitle: actorTitle(hrRequest.reviewer ?? hrRequest.approver, locale),
        status: 'REJECTED',
        at: hrRequest.reviewedAt ?? hrRequest.approvedAt ?? undefined,
        comment: reason
      })
    }
  }

  return {
    title: locale === 'ar' ? 'طلب موارد بشرية' : 'HR Request',
    number: hrRequest.id,
    createdAt: hrRequest.createdAt,
    currentStepLabel,
    statusLabel: String(hrRequest.status),
    metaRows,
    timeline
  }
}
