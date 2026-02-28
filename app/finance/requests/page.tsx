'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export default function FinanceRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/finance/requests')
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const statusVariant = (s: string) => {
    if (s === 'REJECTED') return 'red'
    if (s === 'PAID') return 'green'
    return 'yellow'
  }

  return (
    <div style={{ padding: 16 }}>
      <PageHeader
        title="الطلبات المالية"
        breadcrumbs={['الرئيسية', 'المالية', 'الطلبات']}
        actions={
          <>
            <Button variant="outline" onClick={fetchRequests}>
              🔄 تحديث
            </Button>
            <Button variant="success" onClick={() => router.push('/finance/requests/new')}>
              + طلب جديد
            </Button>
          </>
        }
      />

      {loading ? (
        <div style={{ padding: 24 }}>جاري التحميل...</div>
      ) : requests.length === 0 ? (
        <div style={{ padding: 24, color: '#6B7280' }}>لا توجد طلبات</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {requests.map((r) => (
            <Card key={r.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/finance/requests/${r.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{r.requestNumber}</div>
                  <div style={{ color: '#6B7280', fontSize: 13 }}>{r.title}</div>
                  <div style={{ color: '#6B7280', fontSize: 12, marginTop: 6 }}>{r.requester?.displayName ?? ''}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                  <div style={{ marginTop: 8, fontWeight: 800 }}>{Number(r.amount).toFixed(2)}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
