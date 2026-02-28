import prisma from '@/lib/prisma'
import type { NormalizedPrintDoc, NormalizedTimelineItem } from '@/lib/print/normalize'

function safeParseJsonArray(raw?: string | null): any[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function formatAttachments(raw?: string | null): string {
  const arr = safeParseJsonArray(raw)
  if (!arr.length) return '-'
  return arr
    .map((a: any, idx: number) => {
      const name = a?.name ?? a?.url ?? ''
      const url = a?.url ?? ''
      return `${idx + 1}) ${name}${url ? ` (${url})` : ''}`
    })
    .join('\n')
}

function formatPettyCashItems(items: any[]): string {
  if (!items.length) return '-'
  // Keep for backward compatibility in other areas.
  return items
    .map((it: any, idx: number) => {
      const date = it?.date ? new Date(it.date).toLocaleDateString() : ''
      const vendor = it?.vendor ? ` | ${it.vendor}` : ''
      const amt = it?.amount != null ? Number(it.amount).toFixed(2) : ''
      return `${idx + 1}) ${it.description} | ${amt}${vendor}${date ? ` | ${date}` : ''}`
    })
    .join('\n')
}

function formatTopUps(topUps: any[]): string {
  if (!topUps.length) return '-'
  return topUps
    .map((t: any, idx: number) => {
      const amt = t?.amount != null ? Number(t.amount).toFixed(2) : ''
      const status = t?.status ?? ''
      return `${idx + 1}) ${amt} | ${status} | ${t.reason ?? ''}`
    })
    .join('\n')
}

function titleForUser(user: any, locale: 'ar' | 'en') {
  const sr = user?.systemRole
  if (sr) return locale === 'ar' ? (sr.nameAr ?? sr.nameEn ?? '') : (sr.nameEn ?? sr.nameAr ?? '')
  return user?.role ?? ''
}

export async function getFinanceRequestPrintDoc(id: string, locale: 'ar' | 'en', viewerUserId: string): Promise<NormalizedPrintDoc | null> {
  const fr = await prisma.financeRequest.findUnique({
    where: { id },
    include: {
      requester: { include: { systemRole: true } },
      departmentManager: { include: { systemRole: true } },
      accountant: { include: { systemRole: true } },
      financeManager: { include: { systemRole: true } },
      pettyCashSettlement: {
        include: {
          items: { orderBy: { createdAt: 'asc' } },
          topUps: { orderBy: { createdAt: 'asc' } }
        }
      }
    }
  })

  if (!fr) return null

  const isRequester = fr.requesterId === viewerUserId

  const metaRows = [
    { label: locale === 'ar' ? 'نوع الطلب' : 'Type', value: fr.type },
    { label: locale === 'ar' ? 'العنوان' : 'Title', value: fr.title },
    { label: locale === 'ar' ? 'القسم' : 'Department', value: fr.department ?? '-' },
    { label: locale === 'ar' ? 'المبلغ' : 'Amount', value: String(fr.amount) },
    { label: locale === 'ar' ? 'المستفيد' : 'Beneficiary', value: fr.beneficiaryName ?? '-' },
    { label: locale === 'ar' ? 'مقدم الطلب' : 'Requester', value: fr.requester.displayName },
    { label: locale === 'ar' ? 'المرفقات' : 'Attachments', value: formatAttachments(fr.attachments) }
  ]

  const timeline: NormalizedTimelineItem[] = []

  timeline.push({
    stepName: locale === 'ar' ? 'تقديم الطلب' : 'Submitted',
    actorName: fr.requester.displayName,
    actorTitle: titleForUser(fr.requester, locale),
    status: 'INFO',
    at: fr.createdAt,
    comment: fr.description ?? ''
  })

  // Petty cash section
  if (fr.type === 'PETTY_CASH') {
    const settlement = fr.pettyCashSettlement
    metaRows.push({
      label: locale === 'ar' ? 'حالة التسوية' : 'Settlement status',
      value: settlement?.status ?? '-'
    })

    metaRows.push({
      label: locale === 'ar' ? 'بنود التسوية' : 'Settlement items',
      value: formatPettyCashItems(settlement?.items ?? [])
    })

    metaRows.push({
      label: locale === 'ar' ? 'طلبات الزيادة' : 'Top-ups',
      value: formatTopUps(settlement?.topUps ?? [])
    })

    const totalExpenses = (settlement?.items ?? []).reduce((s: number, it: any) => s + Number(it.amount || 0), 0)
    const paidTopUps = (settlement?.topUps ?? []).filter((t: any) => t.status === 'PAID').reduce((s: number, t: any) => s + Number(t.amount || 0), 0)
    const available = Number(fr.amount || 0) + paidTopUps
    const remaining = available - totalExpenses

    metaRows.push({
      label: locale === 'ar' ? 'إجمالي المصروفات' : 'Total expenses',
      value: totalExpenses.toFixed(2)
    })
    metaRows.push({
      label: locale === 'ar' ? 'زيادات (مدفوعة)' : 'Top-ups (paid)',
      value: paidTopUps.toFixed(2)
    })
    metaRows.push({
      label: locale === 'ar' ? 'المتبقي' : 'Remaining',
      value: remaining.toFixed(2)
    })

    // Settlement timeline (comments hidden from requester except rejection)
    if (settlement) {
      timeline.push({
        stepName: locale === 'ar' ? 'تسوية العهدة' : 'Petty cash settlement',
        actorName: fr.requester.displayName,
        actorTitle: titleForUser(fr.requester, locale),
        status: settlement.status === 'REJECTED' ? 'REJECTED' : settlement.status === 'FINANCE_MANAGER_APPROVED' ? 'APPROVED' : 'INFO',
        at: settlement.submittedAt ?? settlement.updatedAt,
        comment: isRequester && settlement.status !== 'REJECTED' ? '' : (settlement.rejectionReason ?? '')
      })

      if (settlement.status === 'REJECTED' && settlement.rejectionReason) {
        timeline.push({
          stepName: locale === 'ar' ? 'سبب رفض التسوية' : 'Settlement rejection reason',
          actorName: fr.financeManager?.displayName ?? fr.accountant?.displayName ?? '-',
          actorTitle: locale === 'ar' ? 'اعتماد' : 'Approval',
          status: 'REJECTED',
          at: settlement.updatedAt,
          comment: settlement.rejectionReason
        })
      }

      // Top-ups timeline (only show rejection reason for requester)
      for (const t of settlement.topUps ?? []) {
        if (t.status === 'REJECTED') {
          timeline.push({
            stepName: locale === 'ar' ? 'رفض زيادة عهدة' : 'Top-up rejected',
            actorName: fr.financeManager?.displayName ?? fr.accountant?.displayName ?? '-',
            actorTitle: locale === 'ar' ? 'اعتماد' : 'Approval',
            status: 'REJECTED',
            at: t.updatedAt,
            comment: t.rejectionReason ?? ''
          })
        }
      }
    }
  }

  // Dept manager
  timeline.push({
    stepName: locale === 'ar' ? 'اعتماد مدير القسم' : 'Department manager',
    actorName: fr.departmentManager?.displayName ?? '-',
    actorTitle: locale === 'ar' ? 'مدير قسم' : 'Department manager',
    status: fr.currentStep === 'DEPARTMENT_MANAGER' ? 'PENDING' : fr.status === 'REJECTED' && fr.departmentManagerComment ? 'REJECTED' : 'APPROVED',
    at: fr.reviewedAt ?? undefined,
    comment: isRequester && fr.status !== 'REJECTED' ? '' : (fr.departmentManagerComment ?? '')
  })

  // Accountant
  timeline.push({
    stepName: locale === 'ar' ? 'مراجعة المحاسب' : 'Accountant review',
    actorName: fr.accountant?.displayName ?? '-',
    actorTitle: locale === 'ar' ? 'محاسب' : 'Accountant',
    status: fr.currentStep === 'ACCOUNTANT_REVIEW' ? 'PENDING' : fr.currentStep === 'DEPARTMENT_MANAGER' ? 'PENDING' : fr.status === 'REJECTED' && fr.accountantComment ? 'REJECTED' : 'APPROVED',
    at: fr.approvedAt ?? undefined,
    comment: isRequester && fr.status !== 'REJECTED' ? '' : (fr.accountantComment ?? '')
  })

  // Finance manager
  timeline.push({
    stepName: locale === 'ar' ? 'اعتماد المدير المالي' : 'Finance manager approval',
    actorName: fr.financeManager?.displayName ?? '-',
    actorTitle: locale === 'ar' ? 'مدير مالي' : 'Finance manager',
    status: fr.currentStep === 'FINANCE_MANAGER_APPROVAL' ? 'PENDING' : fr.currentStep === 'ACCOUNTANT_EXECUTION' || fr.currentStep === 'PAID' ? 'APPROVED' : fr.status === 'REJECTED' && fr.financeManagerComment ? 'REJECTED' : 'INFO',
    at: fr.approvedAt ?? undefined,
    comment: isRequester && fr.status !== 'REJECTED' ? '' : (fr.financeManagerComment ?? '')
  })

  if (fr.status === 'REJECTED') {
    timeline.push({
      stepName: locale === 'ar' ? 'سبب الرفض' : 'Rejection reason',
      actorName: fr.financeManager?.displayName ?? fr.accountant?.displayName ?? fr.departmentManager?.displayName ?? '-',
      actorTitle: locale === 'ar' ? 'اعتماد' : 'Approval',
      status: 'REJECTED',
      at: fr.updatedAt,
      comment: fr.rejectionReason ?? ''
    })
  }

  const currentStepLabel =
    fr.currentStep === 'DEPARTMENT_MANAGER'
      ? locale === 'ar'
        ? 'عند مدير القسم'
        : 'Department manager'
      : fr.currentStep === 'ACCOUNTANT_REVIEW'
        ? locale === 'ar'
          ? 'عند المحاسب'
          : 'Accountant'
        : fr.currentStep === 'FINANCE_MANAGER_APPROVAL'
          ? locale === 'ar'
            ? 'عند المدير المالي'
            : 'Finance manager'
          : fr.currentStep === 'ACCOUNTANT_EXECUTION'
            ? locale === 'ar'
              ? 'تنفيذ التحويل'
              : 'Execution'
            : fr.currentStep

  return {
    title: locale === 'ar' ? 'طلب مالي' : 'Finance Request',
    number: fr.requestNumber,
    createdAt: fr.createdAt,
    currentStepLabel,
    statusLabel: fr.status,
    metaRows,
    timeline
  }
}
