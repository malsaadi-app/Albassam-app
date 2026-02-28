import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import prisma from '@/lib/prisma'
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

export default async function PrintPettyCashSettlementOnly({
  params,
  searchParams
}: {
  params: Promise<{ financeRequestId: string }>
  searchParams: Promise<{ locale?: string; autop?: string }>
}) {
  const session = await getSession(await cookies())
  if (!session.user) redirect('/auth/login')

  const { financeRequestId } = await params
  const sp = await searchParams
  const locale = (sp.locale === 'en' ? 'en' : 'ar') as 'ar' | 'en'
  const autoPrint = sp.autop === '0' ? false : true

  const fr = await prisma.financeRequest.findUnique({
    where: { id: financeRequestId },
    include: {
      requester: true,
      accountant: true,
      financeManager: true,
      pettyCashSettlement: {
        include: {
          items: { orderBy: { createdAt: 'asc' } },
          topUps: { orderBy: { createdAt: 'asc' } }
        }
      }
    }
  })

  if (!fr || fr.type !== 'PETTY_CASH') {
    return <div style={{ padding: 24 }}>{locale === 'ar' ? 'التسوية غير موجودة' : 'Not found'}</div>
  }

  const uid = session.user.id
  const canSee =
    uid === fr.requesterId || uid === fr.accountantUserId || uid === fr.financeManagerUserId || session.user.role === 'ADMIN'
  if (!canSee) {
    return <div style={{ padding: 24 }}>{locale === 'ar' ? 'غير مصرح' : 'Forbidden'}</div>
  }

  const isRequester = uid === fr.requesterId
  const s = fr.pettyCashSettlement
  const items = s?.items ?? []
  const topUps = s?.topUps ?? []

  const totalExpenses = items.reduce((sum: number, it: any) => sum + Number(it.amount || 0), 0)
  const paidTopUps = topUps.filter((t: any) => t.status === 'PAID').reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)
  const available = Number(fr.amount || 0) + paidTopUps
  const remaining = available - totalExpenses

  // Keep comments hidden for requester except rejection reason
  const rejectionReason = s?.status === 'REJECTED' ? (s.rejectionReason ?? '') : ''

  const doc = {
    title: locale === 'ar' ? 'تسوية عهدة' : 'Petty Cash Settlement',
    number: fr.requestNumber,
    createdAt: s?.submittedAt ?? fr.createdAt,
    currentStepLabel: s?.status ?? '-',
    statusLabel: s?.status ?? '-',
    metaRows: [
      { label: locale === 'ar' ? 'العهدة' : 'Request', value: fr.requestNumber },
      { label: locale === 'ar' ? 'مقدم الطلب' : 'Requester', value: fr.requester.displayName },
      { label: locale === 'ar' ? 'المتاح' : 'Available', value: available.toFixed(2) },
      { label: locale === 'ar' ? 'المصروف' : 'Expenses', value: totalExpenses.toFixed(2) },
      { label: locale === 'ar' ? 'زيادات (مدفوعة)' : 'Top-ups (paid)', value: paidTopUps.toFixed(2) },
      { label: locale === 'ar' ? 'المتبقي' : 'Remaining', value: remaining.toFixed(2) },
      { label: locale === 'ar' ? 'حالة التسوية' : 'Settlement status', value: s?.status ?? '-' }
    ],
    timeline: [
      {
        stepName: locale === 'ar' ? 'إرسال التسوية' : 'Submitted',
        actorName: fr.requester.displayName,
        actorTitle: locale === 'ar' ? 'مقدم العهدة' : 'Requester',
        status: s?.status === 'SUBMITTED' ? 'PENDING' : 'INFO',
        at: s?.submittedAt ?? fr.createdAt,
        comment: ''
      },
      {
        stepName: locale === 'ar' ? 'مراجعة المحاسب' : 'Accountant review',
        actorName: fr.accountant?.displayName ?? '-',
        actorTitle: locale === 'ar' ? 'محاسب' : 'Accountant',
        status: s?.status === 'SUBMITTED' ? 'PENDING' : s?.status === 'ACCOUNTANT_APPROVED' || s?.status === 'FINANCE_MANAGER_APPROVED' ? 'APPROVED' : 'INFO',
        at: s?.updatedAt,
        comment: isRequester && s?.status !== 'REJECTED' ? '' : (s?.accountantComment ?? '')
      },
      {
        stepName: locale === 'ar' ? 'اعتماد المدير المالي' : 'Finance manager approval',
        actorName: fr.financeManager?.displayName ?? '-',
        actorTitle: locale === 'ar' ? 'مدير مالي' : 'Finance manager',
        status: s?.status === 'ACCOUNTANT_APPROVED' ? 'PENDING' : s?.status === 'FINANCE_MANAGER_APPROVED' ? 'APPROVED' : 'INFO',
        at: s?.updatedAt,
        comment: isRequester && s?.status !== 'REJECTED' ? '' : (s?.financeManagerComment ?? '')
      }
    ]
  }

  if (rejectionReason) {
    doc.timeline.push({
      stepName: locale === 'ar' ? 'سبب الرفض' : 'Rejection reason',
      actorName: fr.financeManager?.displayName ?? fr.accountant?.displayName ?? '-',
      actorTitle: locale === 'ar' ? 'اعتماد' : 'Approval',
      status: 'REJECTED',
      at: s?.updatedAt,
      comment: rejectionReason
    })
  }

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
        timeline={doc.timeline.map((t: any) => ({
          ...t,
          at: t.at ? new Date(t.at).toISOString() : undefined
        }))}
        autoPrint={autoPrint}
      />

      <div dir={locale === 'ar' ? 'rtl' : 'ltr'} style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ marginTop: 8, fontSize: 16 }}>{locale === 'ar' ? 'بنود التسوية' : 'Items'}</h2>
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

        <h2 style={{ marginTop: 18, fontSize: 16 }}>{locale === 'ar' ? 'الزيادات' : 'Top-ups'}</h2>
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
      </div>
    </div>
  )
}
