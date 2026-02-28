import prisma from '@/lib/prisma'
import type { NormalizedPrintDoc, NormalizedTimelineItem } from '@/lib/print/normalize'

function safeParseItems(raw: string): Array<any> {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function formatItemsForPrint(items: Array<any>, locale: 'ar' | 'en') {
  if (!items.length) return locale === 'ar' ? '-' : '-'
  return items
    .map((it, idx) => {
      const name = it.itemName ?? it.name ?? ''
      const qty = it.quantity ?? ''
      const unitPrice = it.unitPrice ?? ''
      const total = it.totalPrice ?? ''
      return `${idx + 1}) ${name} | qty: ${qty} | unit: ${unitPrice} | total: ${total}`
    })
    .join('\n')
}

export async function getQuotationPrintDoc(id: string, locale: 'ar' | 'en', viewerUserId: string): Promise<NormalizedPrintDoc | null> {
  const q = await prisma.quotation.findUnique({
    where: { id },
    include: {
      supplier: true
    }
  })

  if (!q) return null

  const pr = await prisma.purchaseRequest.findUnique({
    where: { id: q.purchaseRequestId },
    select: { id: true, requestNumber: true, requestedById: true }
  })

  const isRequester = pr?.requestedById === viewerUserId
  const items = safeParseItems(q.quotedItems)

  const metaRows = [
    { label: locale === 'ar' ? 'رقم العرض' : 'Quotation No', value: q.quotationNumber },
    { label: locale === 'ar' ? 'طلب الشراء' : 'Purchase Request', value: pr?.requestNumber ?? q.purchaseRequestId },
    { label: locale === 'ar' ? 'المورد' : 'Supplier', value: q.supplier?.name ?? '-' },
    { label: locale === 'ar' ? 'الإجمالي' : 'Total', value: String(q.totalAmount) },
    { label: locale === 'ar' ? 'الأصناف' : 'Items', value: formatItemsForPrint(items, locale) },
    { label: locale === 'ar' ? 'ملاحظات المورد' : 'Supplier notes', value: isRequester ? '' : (q.notes ?? '-') }
  ]

  const timeline: NormalizedTimelineItem[] = []
  timeline.push({
    stepName: locale === 'ar' ? 'إضافة عرض السعر' : 'Quotation created',
    actorName: locale === 'ar' ? 'المشتريات' : 'Procurement',
    actorTitle: locale === 'ar' ? 'النظام' : 'System',
    status: 'INFO',
    at: q.createdAt
  })

  if (q.status === 'ACCEPTED') {
    timeline.push({
      stepName: locale === 'ar' ? 'تم اختيار العرض' : 'Accepted',
      actorName: locale === 'ar' ? 'الاعتماد' : 'Approval',
      actorTitle: locale === 'ar' ? 'اعتماد' : 'Approval',
      status: 'APPROVED',
      at: q.updatedAt
    })
  }

  if (q.status === 'REJECTED') {
    timeline.push({
      stepName: locale === 'ar' ? 'تم رفض العرض' : 'Rejected',
      actorName: locale === 'ar' ? 'الاعتماد' : 'Approval',
      actorTitle: locale === 'ar' ? 'اعتماد' : 'Approval',
      status: 'REJECTED',
      at: q.updatedAt
    })
  }

  return {
    title: locale === 'ar' ? 'عرض سعر' : 'Quotation',
    number: q.quotationNumber,
    createdAt: q.createdAt,
    currentStepLabel: q.status,
    statusLabel: q.status,
    metaRows,
    timeline
  }
}
