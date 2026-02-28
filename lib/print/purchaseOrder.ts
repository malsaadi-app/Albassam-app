import prisma from '@/lib/prisma'
import type { NormalizedPrintDoc, NormalizedTimelineItem } from '@/lib/print/normalize'

export async function getPurchaseOrderPrintDoc(id: string, locale: 'ar' | 'en', _viewerUserId: string): Promise<NormalizedPrintDoc | null> {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { supplier: true }
  })
  if (!order) return null

  const metaRows = [
    { label: locale === 'ar' ? 'رقم أمر الشراء' : 'PO No', value: order.orderNumber },
    { label: locale === 'ar' ? 'المورد' : 'Supplier', value: order.supplier?.name ?? '-' },
    { label: locale === 'ar' ? 'الحالة' : 'Status', value: order.status },
    { label: locale === 'ar' ? 'الإجمالي النهائي' : 'Final amount', value: String(order.finalAmount ?? '') }
  ]

  const timeline: NormalizedTimelineItem[] = [
    {
      stepName: locale === 'ar' ? 'إنشاء أمر الشراء' : 'Created',
      actorName: locale === 'ar' ? 'النظام' : 'System',
      actorTitle: locale === 'ar' ? 'مشتريات' : 'Procurement',
      status: 'INFO',
      at: order.createdAt
    }
  ]

  return {
    title: locale === 'ar' ? 'أمر شراء' : 'Purchase Order',
    number: order.orderNumber,
    createdAt: order.createdAt,
    currentStepLabel: order.status,
    statusLabel: order.status,
    metaRows,
    timeline
  }
}
