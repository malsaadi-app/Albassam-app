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
  const dtLocale = locale === 'ar' ? 'ar-SA' : 'en-US'

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
            {locale === 'ar' ? 'تاريخ الإنشاء:' : 'Created:'} {new Date(createdAt).toLocaleString(dtLocale)}
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
            <div style={{ fontWeight: 700, marginTop: 4, whiteSpace: 'pre-wrap' }}>{r.value || '-'}</div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 18, fontSize: 16 }}>{locale === 'ar' ? 'سير الطلب' : 'Workflow'}</h2>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: 14 }}>
        <div style={{ display: 'grid', gap: 12, position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: 6,
              bottom: 6,
              insetInlineStart: 10,
              width: 2,
              background: '#e5e7eb'
            }}
          />

          {timeline.map((t, idx) => {
            const isLast = idx === timeline.length - 1
            return (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '26px 1fr',
                  gap: 12,
                  alignItems: 'start',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 999,
                      background: isLast ? '#111827' : '#94a3b8',
                      border: '2px solid white',
                      boxShadow: '0 0 0 1px #e5e7eb'
                    }}
                  />
                </div>

                <div
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 14,
                    padding: 12,
                    background: '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 900 }}>{t.stepName || '-'}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{t.at ? new Date(t.at).toLocaleString(dtLocale) : '-'}</div>
                  </div>

                  <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {statusBadge(t.status)}
                    <span style={{ fontWeight: 800 }}>{t.actorName || '-'}</span>
                    {t.actorTitle && <span style={{ color: '#6b7280', fontSize: 12 }}>({t.actorTitle})</span>}
                  </div>

                  {t.comment && t.comment.trim().length > 0 && (
                    <div style={{ marginTop: 8, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {t.comment}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ marginTop: 18, fontSize: 12, color: '#6b7280' }}>
        {locale === 'ar' ? 'تم إنشاء هذا المستند تلقائياً من النظام.' : 'This document was generated automatically from the system.'}
      </div>
    </div>
  )
}
