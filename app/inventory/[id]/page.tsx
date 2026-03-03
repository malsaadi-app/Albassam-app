'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function StockItemDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const router = useRouter()

  const [item, setItem] = useState<any>(null)
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [move, setMove] = useState<any>({ movementType: 'IN', quantity: 1, unitCost: '', reference: '', notes: '' })

  const load = async () => {
    setLoading(true)
    const r1 = await fetch(`/api/inventory/items?q=&category=`)
    const d1 = await r1.json().catch(() => ({}))
    const found = (d1.items || []).find((x: any) => x.id === id)
    setItem(found || null)

    const r2 = await fetch(`/api/inventory/movements?stockItemId=${id}`)
    const d2 = await r2.json().catch(() => ({}))
    setMovements(Array.isArray(d2.movements) ? d2.movements : [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const addMovement = async () => {
    const res = await fetch('/api/inventory/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stockItemId: id,
        movementType: move.movementType,
        quantity: Number(move.quantity),
        unitCost: move.unitCost === '' ? undefined : Number(move.unitCost),
        reference: move.reference || null,
        notes: move.notes || null,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'فشل')
      return
    }
    setMove({ movementType: 'IN', quantity: 1, unitCost: '', reference: '', notes: '' })
    await load()
  }

  if (loading) return <div style={{ padding: 16 }}>جاري التحميل…</div>
  if (!item) return <div style={{ padding: 16 }}>الصنف غير موجود.</div>

  return (
    <div style={{ padding: 16, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>{item.itemName}</div>
          <div style={{ color: '#64748B', fontSize: 12 }}>{item.itemCode} • {item.category} • {item.unit}</div>
        </div>
        <Button variant="outline" onClick={() => router.back()}>رجوع</Button>
      </div>

      <Card variant="default">
        <div style={{ padding: 16, display: 'grid', gap: 6 }}>
          <div style={{ fontWeight: 900 }}>الرصيد الحالي: {item.currentStock}</div>
          <div style={{ color: '#64748B', fontSize: 12 }}>قيمة تقريبية: {item.totalValue}</div>
        </div>
      </Card>

      <Card variant="default">
        <div style={{ padding: 16, display: 'grid', gap: 10 }}>
          <div style={{ fontWeight: 900 }}>إضافة حركة</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            <select value={move.movementType} onChange={(e) => setMove((p: any) => ({ ...p, movementType: e.target.value }))} style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB', background: 'white' }}>
              <option value="IN">وارد</option>
              <option value="OUT">صرف</option>
              <option value="ADJUSTMENT">تسوية</option>
              <option value="RETURN">مرتجع</option>
              <option value="DAMAGE">تالف</option>
            </select>
            <input value={move.quantity} onChange={(e) => setMove((p: any) => ({ ...p, quantity: e.target.value }))} inputMode="decimal" placeholder="الكمية" style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB' }} />
            <input value={move.unitCost} onChange={(e) => setMove((p: any) => ({ ...p, unitCost: e.target.value }))} inputMode="decimal" placeholder="سعر الوحدة (اختياري)" style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB' }} />
            <input value={move.reference} onChange={(e) => setMove((p: any) => ({ ...p, reference: e.target.value }))} placeholder="مرجع (اختياري)" style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB' }} />
          </div>
          <textarea value={move.notes} onChange={(e) => setMove((p: any) => ({ ...p, notes: e.target.value }))} placeholder="ملاحظات" style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB', minHeight: 80 }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={addMovement}>تسجيل الحركة</Button>
          </div>
        </div>
      </Card>

      <Card variant="default">
        <div style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>حركات المخزون (آخر 200)</div>
          {movements.length === 0 ? (
            <div style={{ color: '#64748B' }}>لا يوجد.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {movements.map((m) => (
                <div key={m.id} style={{ border: '1px solid #E5E7EB', borderRadius: 14, padding: 12, background: 'white', display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 900 }}>{m.movementType} • {m.quantity}</div>
                    <div style={{ color: '#64748B', fontSize: 12 }}>{new Date(m.createdAt).toLocaleString()}</div>
                    {m.reference ? <div style={{ color: '#64748B', fontSize: 12 }}>مرجع: {m.reference}</div> : null}
                  </div>
                  <div style={{ color: '#64748B', fontSize: 12, maxWidth: 380 }}>{m.notes || ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
