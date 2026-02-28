'use client'

import { useEffect } from 'react'

export type PrintDocProps = {
  locale: 'ar' | 'en'
  title: string
  number: string
  createdAt: string
  currentStepLabel: string
  statusLabel: string
  metaRows: Array<{ label: string; value: string }>
  timeline: Array<{
    stepName: string
    actorName: string
    actorTitle: string
    status: string
    at?: string
    comment?: string
  }>
  autoPrint?: boolean
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; fg: string }> = {
    PENDING: { bg: '#FEF3C7', fg: '#92400E' },
    APPROVED: { bg: '#D1FAE5', fg: '#065F46' },
    REJECTED: { bg: '#FEE2E2', fg: '#991B1B' },
    INFO: { bg: '#E5E7EB', fg: '#374151' }
  }
  const c = map[status] ?? map.INFO
  return (
    <span
      style={{
        background: c.bg,
        color: c.fg,
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700
      }}
    >
      {status}
    </span>
  )
}

export function PrintDoc({
  locale,
  title,
  number,
  createdAt,
  currentStepLabel,
  statusLabel,
  metaRows,
  timeline,
  autoPrint = true
}: PrintDocProps) {
  useEffect(() => {
    if (!autoPrint) return
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [autoPrint])

  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <div dir={dir} style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div className="no-print" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          onClick={() => window.print()}
          style={{
            border: '1px solid #e5e7eb',
            background: 'white',
            padding: '10px 14px',
            borderRadius: 10,
            fontWeight: 700
          }}
        >
          {locale === 'ar' ? 'طباعة' : 'Print'}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>{title}</h1>
          <div style={{ color: '#6b7280', marginTop: 4 }}>
            {locale === 'ar' ? 'رقم:' : 'No:'} {number}
          </div>
          <div style={{ color: '#6b7280', marginTop: 4 }}>
            {locale === 'ar' ? 'تاريخ الإنشاء:' : 'Created:'} {new Date(createdAt).toLocaleString()}
          </div>
        </div>
        <div style={{ textAlign: locale === 'ar' ? 'left' : 'right' }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{locale === 'ar' ? 'الحالة' : 'Status'}</div>
          <div style={{ marginTop: 6 }}>{statusBadge(statusLabel)}</div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#6b7280' }}>{locale === 'ar' ? 'متوقف عند' : 'Stopped at'}</div>
          <div style={{ marginTop: 4, fontWeight: 800 }}>{currentStepLabel}</div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '18px 0' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {metaRows.map((r, idx) => (
          <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{r.label}</div>
            <div style={{ fontWeight: 700, marginTop: 4 }}>{r.value || '-'}</div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 18, fontSize: 16 }}>{locale === 'ar' ? 'مسار الطلب' : 'Workflow'}</h2>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ textAlign: 'start', padding: 10, fontSize: 12, color: '#6b7280' }}>{locale === 'ar' ? 'المرحلة' : 'Step'}</th>
              <th style={{ textAlign: 'start', padding: 10, fontSize: 12, color: '#6b7280' }}>{locale === 'ar' ? 'المسؤول' : 'Actor'}</th>
              <th style={{ textAlign: 'start', padding: 10, fontSize: 12, color: '#6b7280' }}>{locale === 'ar' ? 'القرار' : 'Status'}</th>
              <th style={{ textAlign: 'start', padding: 10, fontSize: 12, color: '#6b7280' }}>{locale === 'ar' ? 'التاريخ' : 'Date'}</th>
              <th style={{ textAlign: 'start', padding: 10, fontSize: 12, color: '#6b7280' }}>{locale === 'ar' ? 'تعليق' : 'Comment'}</th>
            </tr>
          </thead>
          <tbody>
            {timeline.map((t, idx) => (
              <tr key={idx} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: 10, verticalAlign: 'top' }}>{t.stepName}</td>
                <td style={{ padding: 10, verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 700 }}>{t.actorName || '-'}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{t.actorTitle || '-'}</div>
                </td>
                <td style={{ padding: 10, verticalAlign: 'top' }}>{statusBadge(t.status)}</td>
                <td style={{ padding: 10, verticalAlign: 'top', fontSize: 12, color: '#6b7280' }}>
                  {t.at ? new Date(t.at).toLocaleString() : '-'}
                </td>
                <td style={{ padding: 10, verticalAlign: 'top' }}>{t.comment || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 18, fontSize: 12, color: '#6b7280' }}>
        {locale === 'ar' ? 'تم إنشاء هذا المستند تلقائياً من النظام.' : 'This document was generated automatically from the system.'}
      </div>
    </div>
  )
}
