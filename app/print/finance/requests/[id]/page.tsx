import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import prisma from '@/lib/prisma'

import { getFinanceRequestPrintDoc } from '@/lib/print/financeRequest'
import { PrintDoc } from '@/app/print/components/PrintDoc'

function safeParseJsonArray(raw?: string | null): any[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default async function PrintFinanceRequestPage({
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

  // Use base doc
  const doc = await getFinanceRequestPrintDoc(id, locale, session.user.id)
  if (!doc) {
    return <div style={{ padding: 24 }}>{locale === 'ar' ? 'الطلب غير موجود' : 'Not found'}</div>
  }

  // If petty cash: render extra tables instead of long multi-line text.
  const fr = await prisma.financeRequest.findUnique({
    where: { id },
    include: {
      pettyCashSettlement: {
        include: {
          items: { orderBy: { createdAt: 'asc' } },
          topUps: { orderBy: { createdAt: 'asc' } }
        }
      }
    }
  })

  const settlement = fr?.pettyCashSettlement
  const items = settlement?.items ?? []
  const topUps = settlement?.topUps ?? []

  return (
    <div>
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

      {/* Extra tables for petty cash */}
      {fr?.type === 'PETTY_CASH' && (
        <div
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
          style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}
        >
          <h2 style={{ marginTop: 8, fontSize: 16 }}>{locale === 'ar' ? 'بنود تسوية العهدة' : 'Settlement items'}</h2>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ textAlign: 'start', padding: 10, fontSize: 12, color: '#6b7280' }}>#</th>
                  <th style={{ textAlign: 'start', padding: 10, fontSize: 12, color: '#6b7280' }}>{locale === 'ar' ? 'الوصف' : 'Description'}</th>
                  <th style={{ textAlign: 'start', padding: 10, fontSize: 12, color: '#6b7280' }}>{locale === 'ar' ? 'المورد' : 'Vendor'}</th>
                  <th style={{ textAlign: 'start', padding: 10, fontSize: 12, color: '#6b7280' }}>{locale === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th style={{ textAlign: 'start', padding: 10, fontSize: 12, color: '#6b7280' }}>{locale === 'ar' ? 'المبلغ' : 'Amount'}</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td colSpan={5} style={{ padding: 10, color: '#6b7280' }}>
                      {locale === 'ar' ? 'لا توجد بنود' : 'No items'}
                    </td>
                  </tr>
                ) : (
                  items.map((it: any, idx: number) => (
                    <tr key={it.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: 10 }}>{idx + 1}</td>
                      <td style={{ padding: 10 }}>{it.description}</td>
                      <td style={{ padding: 10 }}>{it.vendor ?? '-'}</td>
                      <td style={{ padding: 10, color: '#6b7280', fontSize: 12 }}>
                        {it.date ? new Date(it.date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US') : '-'}
                      </td>
                      <td style={{ padding: 10, fontWeight: 700 }}>{Number(it.amount).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h2 style={{ marginTop: 18, fontSize: 16 }}>{locale === 'ar' ? 'طلبات زيادة العهدة' : 'Top-ups'}</h2>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ textAlign: 'start', padding: 10, fontSize: 12, color: '#6b7280' }}>#</th>
                  <th style={{ textAlign: 'start', padding: 10, fontSize: 12, color: '#6b7280' }}>{locale === 'ar' ? 'المبلغ' : 'Amount'}</th>
                  <th style={{ textAlign: 'start', padding: 10, fontSize: 12, color: '#6b7280' }}>{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th style={{ textAlign: 'start', padding: 10, fontSize: 12, color: '#6b7280' }}>{locale === 'ar' ? 'السبب' : 'Reason'}</th>
                </tr>
              </thead>
              <tbody>
                {topUps.length === 0 ? (
                  <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td colSpan={4} style={{ padding: 10, color: '#6b7280' }}>
                      {locale === 'ar' ? 'لا توجد زيادات' : 'No top-ups'}
                    </td>
                  </tr>
                ) : (
                  topUps.map((t: any, idx: number) => (
                    <tr key={t.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: 10 }}>{idx + 1}</td>
                      <td style={{ padding: 10, fontWeight: 700 }}>{Number(t.amount).toFixed(2)}</td>
                      <td style={{ padding: 10 }}>{t.status}</td>
                      <td style={{ padding: 10, whiteSpace: 'pre-wrap' }}>{t.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Attachments for expense items (optional listing) */}
          {items.some((it: any) => (it.attachments ? safeParseJsonArray(it.attachments).length > 0 : false)) && (
            <>
              <h2 style={{ marginTop: 18, fontSize: 16 }}>{locale === 'ar' ? 'مرفقات البنود' : 'Item attachments'}</h2>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
                {items.map((it: any, idx: number) => {
                  const atts = safeParseJsonArray(it.attachments)
                  if (!atts.length) return null
                  return (
                    <div key={it.id} style={{ marginBottom: 10 }}>
                      <div style={{ fontWeight: 800 }}>{idx + 1}) {it.description}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                        {atts.map((a: any, i: number) => `${i + 1}. ${a?.name ?? a?.url ?? ''} (${a?.url ?? ''})`).join(' | ')}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <div style={{ marginTop: 18, fontSize: 12, color: '#6b7280' }}>
            {locale === 'ar' ? 'ملاحظة: هذه الجداول مخصصة لطباعة العهدة بشكل أوضح.' : 'Note: These tables are included for clearer petty cash printing.'}
          </div>
        </div>
      )}
    </div>
  )
}
