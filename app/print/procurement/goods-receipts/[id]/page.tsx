import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { PrintDoc } from '@/app/print/components/PrintDoc'
import { getGoodsReceiptPrintDoc } from '@/lib/print/goodsReceipt'

export default async function PrintGoodsReceiptPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ locale?: string; autop?: string }>
}) {
  const session = await getSession(await cookies())
  if (!session.user) redirect('/auth/login')

  const { id } = await params
  const sp = await searchParams
  const locale = (sp.locale === 'en' ? 'en' : 'ar') as 'ar' | 'en'
  const autoPrint = sp.autop === '0' ? false : true

  const doc = await getGoodsReceiptPrintDoc(id, locale)
  if (!doc) {
    return <div style={{ padding: 24 }}>{locale === 'ar' ? 'الطلب غير موجود' : 'Not found'}</div>
  }

  return (
    <PrintDoc
      locale={locale}
      title={doc.title}
      number={doc.number}
      createdAt={doc.createdAt.toISOString()}
      currentStepLabel={doc.currentStepLabel}
      statusLabel={doc.statusLabel}
      metaRows={doc.metaRows}
      timeline={doc.timeline.map((t) => ({
        ...t,
        at: t.at ? t.at.toISOString() : undefined
      }))}
      autoPrint={autoPrint}
    />
  )
}
