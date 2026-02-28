'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { getInitialLocale } from '@/lib/i18n'

export default function FinanceRequestDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [comment, setComment] = useState('')

  const fetchOne = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/finance/requests/${id}`)
      const d = await res.json()
      if (res.ok) setData(d)
      else alert(d.error || 'خطأ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOne()
  }, [id])

  const act = async (action: 'approve' | 'reject') => {
    const res = await fetch(`/api/finance/requests/${id}/process-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, comment })
    })
    const d = await res.json()
    if (!res.ok) {
      alert(d.error || 'خطأ')
      return
    }
    setComment('')
    await fetchOne()
  }

  const markPaid = async () => {
    const res = await fetch(`/api/finance/requests/${id}/mark-paid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment })
    })
    const d = await res.json()
    if (!res.ok) {
      alert(d.error || 'خطأ')
      return
    }
    setComment('')
    await fetchOne()
  }

  if (loading) return <div style={{ padding: 24 }}>جاري التحميل...</div>
  if (!data) return <div style={{ padding: 24 }}>غير موجود</div>

  return (
    <div style={{ padding: 16 }}>
      <PageHeader
        title={`طلب مالي ${data.requestNumber}`}
        breadcrumbs={['الرئيسية', 'المالية', 'تفاصيل']}
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              onClick={() => {
                const locale = getInitialLocale()
                window.open(`/print/finance/requests/${id}?locale=${locale}`, '_blank')
              }}
            >
              🖨️ طباعة
            </Button>
            <Button variant="outline" onClick={() => router.push('/finance/requests')}>
              ← رجوع
            </Button>
          </div>
        }
      />

      <div style={{ display: 'grid', gap: 12, maxWidth: 900 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 900 }}>{data.title}</div>
              <div style={{ color: '#6B7280', marginTop: 6 }}>{data.type}</div>
              <div style={{ color: '#6B7280', marginTop: 6 }}>{data.requester?.displayName}</div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <Badge variant={data.status === 'REJECTED' ? 'red' : data.status === 'PAID' ? 'green' : 'yellow'}>
                {data.status}
              </Badge>
              <div style={{ marginTop: 10, fontWeight: 900 }}>{Number(data.amount).toFixed(2)}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#6B7280' }}>Step: {data.currentStep}</div>
            </div>
          </div>

          {data.description && <div style={{ marginTop: 12 }}>{data.description}</div>}
          {data.beneficiaryName && <div style={{ marginTop: 8, color: '#6B7280' }}>المستفيد: {data.beneficiaryName}</div>}

          {data.attachments?.length ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>المرفقات</div>
              <ul>
                {data.attachments.map((a: any, idx: number) => (
                  <li key={idx}>
                    <a href={a.url} target="_blank" rel="noreferrer">
                      {a.name || a.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.status === 'REJECTED' && data.rejectionReason ? (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: '#FEE2E2', color: '#991B1B' }}>
              سبب الرفض: {data.rejectionReason}
            </div>
          ) : null}
        </Card>

        <Card style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>إجراء</div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="تعليق (مطلوب عند الرفض)"
            style={{ width: '100%', padding: 10 }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            <Button variant="success" onClick={() => act('approve')}>
              موافقة
            </Button>
            <Button variant="danger" onClick={() => act('reject')}>
              رفض
            </Button>
            {data.currentStep === 'ACCOUNTANT_EXECUTION' && (
              <Button variant="primary" onClick={markPaid}>
                تم التحويل/السداد
              </Button>
            )}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#6B7280' }}>
            ملاحظة: التعليقات لا تظهر لمقدم الطلب إلا في حالة الرفض.
          </div>
        </Card>
      </div>
    </div>
  )
}
