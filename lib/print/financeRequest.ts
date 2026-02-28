import prisma from '@/lib/prisma'
import type { NormalizedPrintDoc, NormalizedTimelineItem } from '@/lib/print/normalize'

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
      financeManager: { include: { systemRole: true } }
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
    { label: locale === 'ar' ? 'مقدم الطلب' : 'Requester', value: fr.requester.displayName }
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
