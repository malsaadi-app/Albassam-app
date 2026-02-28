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

function formatItems(items: Array<any>) {
  if (!items.length) return '-'
  return items
    .map((it, idx) => {
      const name = it.name ?? ''
      const ordered = it.orderedQty ?? ''
      const received = it.receivedQty ?? ''
      const unit = it.unit ?? ''
      const cond = it.condition ?? ''
      return `${idx + 1}) ${name} | ordered: ${ordered} | received: ${received} ${unit}${cond ? ` | ${cond}` : ''}`
    })
    .join('\n')
}

export async function getGoodsReceiptPrintDoc(id: string, locale: 'ar' | 'en'): Promise<NormalizedPrintDoc | null> {
  const r = await prisma.goodsReceipt.findUnique({
    where: { id },
    include: {
      purchaseOrder: { include: { supplier: true } }
    }
  })

  if (!r) return null

  const items = safeParseItems(r.items)

  const metaRows = [
    { label: locale === 'ar' ? 'رقم السند' : 'Receipt No', value: r.receiptNumber },
    { label: locale === 'ar' ? 'أمر الشراء' : 'Purchase Order', value: r.purchaseOrder?.orderNumber ?? r.purchaseOrderId },
    { label: locale === 'ar' ? 'المورد' : 'Supplier', value: r.purchaseOrder?.supplier?.name ?? '-' },
    { label: locale === 'ar' ? 'مستلم البضاعة' : 'Received by', value: r.receivedBy },
    { label: locale === 'ar' ? 'الحالة' : 'Status', value: r.status },
    { label: locale === 'ar' ? 'الأصناف' : 'Items', value: formatItems(items) },
    { label: locale === 'ar' ? 'ملاحظات' : 'Notes', value: r.notes ?? '-' }
  ]

  const timeline: NormalizedTimelineItem[] = [
    {
      stepName: locale === 'ar' ? 'إنشاء سند الاستلام' : 'Created',
      actorName: r.receivedBy,
      actorTitle: locale === 'ar' ? 'مستلم' : 'Receiver',
      status: 'INFO',
      at: r.createdAt
    },
    {
      stepName: locale === 'ar' ? 'الحالة الحالية' : 'Current status',
      actorName: locale === 'ar' ? 'النظام' : 'System',
      actorTitle: locale === 'ar' ? 'مشتريات' : 'Procurement',
      status: r.status === 'REJECTED' ? 'REJECTED' : r.status === 'ACCEPTED' ? 'APPROVED' : 'INFO',
      at: r.updatedAt,
      comment: r.qualityNotes ?? ''
    }
  ]

  return {
    title: locale === 'ar' ? 'سند استلام' : 'Goods Receipt',
    number: r.receiptNumber,
    createdAt: r.receiptDate,
    currentStepLabel: r.status,
    statusLabel: r.status,
    metaRows,
    timeline
  }
}
